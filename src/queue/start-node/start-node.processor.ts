import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AxiosService } from '@common/axios/axios.service';
import { EVENTS } from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { GetPreparedConfigWithUsersQuery } from '@modules/users/queries/get-prepared-config-with-users';
import { NodesRepository } from '@modules/nodes';

import { StopNodeQueueService } from '@queue/stop-node';

import { StartNodeJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.startNode, {
    concurrency: 40,
})
export class StartNodeQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(StartNodeQueueProcessor.name);

    constructor(
        private readonly axios: AxiosService,
        private readonly nodesRepository: NodesRepository,
        private readonly stopNodeQueueService: StopNodeQueueService,
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super();
    }

    async process(job: Job<{ nodeUuid: string }>) {
        try {
            const { nodeUuid } = job.data;

            const nodeEntity = await this.nodesRepository.findByUUID(nodeUuid);

            if (!nodeEntity) {
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

                await this.nodesRepository.update({
                    uuid: nodeEntity.uuid,
                    isDisabled: true,
                    activeConfigProfileUuid: null,
                    isConnecting: false,
                    isXrayRunning: false,
                    isNodeOnline: false,
                    isConnected: false,
                    lastStatusMessage: null,
                    lastStatusChange: new Date(),
                    usersOnline: 0,
                });

                await this.stopNodeQueueService.stopNode({
                    nodeUuid: nodeEntity.uuid,
                    isNeedToBeDeleted: false,
                });

                return;
            }

            await this.nodesRepository.update({
                uuid: nodeEntity.uuid,
                isConnecting: true,
            });

            const xrayStatusResponse = await this.axios.getNodeHealth(
                nodeEntity.address,
                nodeEntity.port,
            );

            if (!xrayStatusResponse.isOk) {
                await this.nodesRepository.update({
                    uuid: nodeEntity.uuid,
                    isXrayRunning: false,
                    isNodeOnline: false,
                    lastStatusMessage: xrayStatusResponse.message ?? null,
                    lastStatusChange: new Date(),
                    isConnected: false,
                    isConnecting: false,
                    usersOnline: 0,
                });

                this.logger.error(
                    `Pre-check failed. Node: ${nodeEntity.uuid} – ${nodeEntity.address}:${nodeEntity.port}, error: ${xrayStatusResponse.message}`,
                );

                return;
            }

            const startTime = Date.now();
            const config = await this.queryBus.execute(
                new GetPreparedConfigWithUsersQuery(
                    nodeEntity.activeConfigProfileUuid,
                    nodeEntity.activeInbounds,
                ),
            );

            this.logger.log(`Generated config for node in ${Date.now() - startTime}ms`);

            if (!config.isOk || !config.response) {
                throw new Error('Failed to get config for node');
            }

            const reqStartTime = Date.now();

            const res = await this.axios.startXray(
                config.response.config as unknown as Record<string, unknown>,
                Buffer.from(JSON.stringify(config.response.hashes)).toString('base64'),
                nodeEntity.address,
                nodeEntity.port,
            );

            this.logger.log(`Started node in ${Date.now() - reqStartTime}ms`);

            if (!res.isOk || !res.response) {
                await this.nodesRepository.update({
                    uuid: nodeEntity.uuid,
                    isXrayRunning: false,
                    isNodeOnline: false,
                    lastStatusMessage: res.message ?? null,
                    lastStatusChange: new Date(),
                    isConnected: false,
                    isConnecting: false,
                    usersOnline: 0,
                });
                return;
            }

            const nodeResponse = res.response.response;

            const node = await this.nodesRepository.update({
                uuid: nodeEntity.uuid,
                isXrayRunning: nodeResponse.isStarted,
                xrayVersion: nodeResponse.version,
                nodeVersion: nodeResponse.nodeInformation?.version || null,
                isNodeOnline: true,
                isConnected: nodeResponse.isStarted,
                lastStatusMessage: nodeResponse.error ?? null,
                lastStatusChange: new Date(),
                isConnecting: false,
                cpuCount: nodeResponse.systemInformation?.cpuCores ?? null,
                cpuModel: nodeResponse.systemInformation?.cpuModel ?? null,
                totalRam: nodeResponse.systemInformation?.memoryTotal ?? null,
                usersOnline: 0,
            });

            if (!nodeEntity.isConnected) {
                this.eventEmitter.emit(
                    EVENTS.NODE.CONNECTION_RESTORED,
                    new NodeEvent(node, EVENTS.NODE.CONNECTION_RESTORED),
                );
            }

            return;
        } catch (error) {
            this.logger.error(`Error handling "${StartNodeJobNames.startNode}" job: ${error}`);
        }
    }
}
