import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';
import { AxiosService } from '@common/axios/axios.service';
import { EVENTS } from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { GetPreparedConfigWithUsersQuery } from '@modules/users/queries/get-prepared-config-with-users';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';
import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';
import { NodesQueuesService } from '../nodes-queues.service';

@Processor(QUEUES_NAMES.NODES.START, {
    concurrency: 40,
})
export class StartNodeProcessor extends WorkerHost {
    private readonly logger = new Logger(StartNodeProcessor.name);

    constructor(
        private readonly axios: AxiosService,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly commandBus: CommandBus,
    ) {
        super();
    }

    async process(job: Job<{ nodeUuid: string }>) {
        try {
            const { nodeUuid } = job.data;

            const { isOk, response: nodeEntity } = await this.queryBus.execute(
                new GetNodeByUuidQuery(nodeUuid),
            );

            if (!isOk || !nodeEntity) {
                this.logger.error(`Node ${nodeUuid} not found`);
                return;
            }

            if (nodeEntity.isConnecting) {
                return;
            }

            if (nodeEntity.activeInbounds.length === 0 || !nodeEntity.activeConfigProfileUuid) {
                this.logger.warn(
                    `Node ${nodeUuid} has no active config profile or inbounds, disabling and clearing profile from node...`,
                );

                await this.commandBus.execute(
                    new UpdateNodeCommand({
                        uuid: nodeEntity.uuid,
                        isDisabled: true,
                        activeConfigProfileUuid: null,
                        isConnecting: false,
                        isConnected: false,
                        lastStatusMessage: null,
                        lastStatusChange: new Date(),
                        usersOnline: 0,
                    }),
                );

                await this.nodesQueuesService.stopNode({
                    nodeUuid: nodeEntity.uuid,
                    isNeedToBeDeleted: false,
                });

                return;
            }

            await this.commandBus.execute(
                new UpdateNodeCommand({
                    uuid: nodeEntity.uuid,
                    isConnecting: true,
                }),
            );

            const xrayStatusResponse = await this.axios.getNodeHealth(
                nodeEntity.address,
                nodeEntity.port,
            );

            if (!xrayStatusResponse.isOk || !xrayStatusResponse.response) {
                await this.commandBus.execute(
                    new UpdateNodeCommand({
                        uuid: nodeEntity.uuid,
                        lastStatusMessage: xrayStatusResponse.message ?? null,
                        lastStatusChange: new Date(),
                        isConnected: false,
                        isConnecting: false,
                        usersOnline: 0,
                    }),
                );

                this.logger.error(
                    `Pre-check failed. Node: ${nodeEntity.uuid} – ${nodeEntity.address}:${nodeEntity.port}, error: ${xrayStatusResponse.message}`,
                );

                return;
            }

            if (
                xrayStatusResponse.response.nodeVersion === null ||
                xrayStatusResponse.response.nodeVersion === undefined
            ) {
                await this.commandBus.execute(
                    new UpdateNodeCommand({
                        uuid: nodeEntity.uuid,
                        lastStatusMessage:
                            'Unknown node version. Please upgrade Remnawave Node to the latest version.',
                        lastStatusChange: new Date(),
                        isConnected: false,
                        isConnecting: false,
                        usersOnline: 0,
                    }),
                );

                this.logger.error(
                    `Node ${nodeEntity.uuid} – unknown node version. Please upgrade Remnawave Node to the latest version.`,
                );
                return;
            }

            const startTime = getTime();
            const config = await this.queryBus.execute(
                new GetPreparedConfigWithUsersQuery(
                    nodeEntity.activeConfigProfileUuid,
                    nodeEntity.activeInbounds,
                ),
            );

            this.logger.log(`Generated config for node in ${formatExecutionTime(startTime)}`);

            if (!config.isOk || !config.response) {
                throw new Error('Failed to get config for node');
            }

            const reqStartTime = getTime();

            const res = await this.axios.startXray(
                {
                    xrayConfig: config.response.config as unknown as Record<string, unknown>,
                    internals: { hashes: config.response.hashesPayload, forceRestart: false },
                },
                nodeEntity.address,
                nodeEntity.port,
            );

            this.logger.log(`Started node in ${formatExecutionTime(reqStartTime)}`);

            if (!res.isOk || !res.response) {
                await this.commandBus.execute(
                    new UpdateNodeCommand({
                        uuid: nodeEntity.uuid,
                        lastStatusMessage: res.message ?? null,
                        lastStatusChange: new Date(),
                        isConnected: false,
                        isConnecting: false,
                        usersOnline: 0,
                    }),
                );

                return;
            }

            const nodeResponse = res.response.response;

            const { isOk: isOkUpdateNode, response: updatedNode } = await this.commandBus.execute(
                new UpdateNodeCommand({
                    uuid: nodeEntity.uuid,
                    xrayVersion: nodeResponse.version,
                    nodeVersion: nodeResponse.nodeInformation?.version || null,
                    isConnected: nodeResponse.isStarted,
                    lastStatusMessage: nodeResponse.error ?? null,
                    lastStatusChange: new Date(),
                    isConnecting: false,
                    cpuCount: nodeResponse.systemInformation?.cpuCores ?? null,
                    cpuModel: nodeResponse.systemInformation?.cpuModel ?? null,
                    totalRam: nodeResponse.systemInformation?.memoryTotal ?? null,
                    usersOnline: 0,
                }),
            );

            if (!isOkUpdateNode || !updatedNode) {
                this.logger.error(`Failed to update node ${nodeEntity.uuid}`);
                return;
            }

            if (!nodeEntity.isConnected) {
                this.eventEmitter.emit(
                    EVENTS.NODE.CONNECTION_RESTORED,
                    new NodeEvent(updatedNode, EVENTS.NODE.CONNECTION_RESTORED),
                );
            }

            return;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.START_NODE}" job: ${error}`);
        }
    }
}
