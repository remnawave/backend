import { Job } from 'bullmq';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Scope } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AxiosService } from '@common/axios/axios.service';

import { GetPreparedConfigWithUsersQuery } from '@modules/users/queries/get-prepared-config-with-users/get-prepared-config-with-users.query';
import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';
import { NodesEntity, NodesRepository } from '@modules/nodes';

import { StartAllNodesQueueService } from '@queue/start-all-nodes';
import { StartNodeQueueService } from '@queue/start-node';
import { StopNodeQueueService } from '@queue/stop-node';

import { StartAllNodesByProfileJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(
    {
        name: QueueNames.startAllNodesByProfile,
        scope: Scope.REQUEST,
    },
    {
        concurrency: 5,
    },
)
export class StartAllNodesByProfileQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(StartAllNodesByProfileQueueProcessor.name);
    private readonly CONCURRENCY: number;

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly axios: AxiosService,
        private readonly startNodeQueueService: StartNodeQueueService,
        private readonly stopNodeQueueService: StopNodeQueueService,
        private readonly startAllNodesQueueService: StartAllNodesQueueService,
        private readonly queryBus: QueryBus,
    ) {
        super();
        this.CONCURRENCY = 20;
    }

    async process(job: Job) {
        switch (job.name) {
            case StartAllNodesByProfileJobNames.startAllNodesByProfile:
                return this.handleStartAllNodesByProfile(job.data);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleStartAllNodesByProfile(payload: {
        profileUuid: string;
        emitter: string;
        force?: boolean;
    }) {
        await this.startNodeQueueService.queue.pause();
        await this.startAllNodesQueueService.queue.pause();

        try {
            const nodes = await this.nodesRepository.findByCriteria({
                isDisabled: false,
                activeConfigProfileUuid: payload.profileUuid,
            });

            if (!nodes) {
                return;
            }

            const activeInboundsOnNodes = new Map<string, ConfigProfileInboundEntity>();
            const activeNodeTags = new Map<string, string[]>();

            for (const node of nodes) {
                if (node.activeInbounds.length === 0) {
                    this.logger.warn(
                        `No active inbounds found for node ${node.uuid} with profile ${payload.profileUuid}, disabling and clearing profile from node...`,
                    );

                    await this.nodesRepository.update({
                        uuid: node.uuid,
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
                        nodeUuid: node.uuid,
                        isNeedToBeDeleted: false,
                    });

                    continue;
                }

                this.logger.log(
                    `Node ${node.uuid} has ${node.activeInbounds.length} active inbounds.`,
                );

                await this.nodesRepository.update({
                    uuid: node.uuid,
                    isConnecting: true,
                });

                for (const inbound of node.activeInbounds) {
                    if (activeInboundsOnNodes.has(inbound.tag)) {
                        continue;
                    } else {
                        activeInboundsOnNodes.set(inbound.tag, inbound);
                    }
                }

                activeNodeTags.set(
                    node.uuid,
                    node.activeInbounds.map((inbound) => inbound.tag),
                );
            }

            if (activeInboundsOnNodes.size === 0) {
                return;
            }

            const startTime = Date.now();

            const config = await this.queryBus.execute(
                new GetPreparedConfigWithUsersQuery(
                    payload.profileUuid,
                    Array.from(activeInboundsOnNodes.values()),
                ),
            );

            this.logger.log(`Generated config for nodes by Profile in ${Date.now() - startTime}ms`);

            const mapper = async (node: NodesEntity) => {
                if (!config.response) {
                    throw new Error('Failed to get config');
                }

                const activeNodeInboundsTags = new Set(activeNodeTags.get(node.uuid));

                if (!activeNodeInboundsTags) {
                    throw new Error('Failed to get active node inbounds tags');
                }

                const filteredInboundsHashes = config.response.hashes.inbounds.filter((inbound) =>
                    activeNodeInboundsTags.has(inbound.tag),
                );

                const hashPayload = Buffer.from(
                    JSON.stringify({
                        emptyConfig: config.response.hashes.emptyConfig,
                        inbounds: filteredInboundsHashes,
                    }),
                ).toString('base64');

                const response = await this.axios.startXray(
                    {
                        ...config.response.config,
                        inbounds: config.response.config.inbounds.filter(
                            (inbound) =>
                                activeNodeInboundsTags.has(inbound.tag) ||
                                this.isUnsecureInbound(inbound.protocol),
                        ),
                    } as unknown as Record<string, unknown>,
                    hashPayload,
                    node.address,
                    node.port,
                    payload.force,
                );

                switch (response.isOk) {
                    case false:
                        await this.nodesRepository.update({
                            uuid: node.uuid,
                            isXrayRunning: false,
                            isNodeOnline: false,
                            lastStatusMessage: response.message ?? null,
                            lastStatusChange: new Date(),
                            isConnected: false,
                            isConnecting: false,
                            usersOnline: 0,
                        });

                        return;
                    case true:
                        if (!response.response?.response) {
                            throw new Error('Failed to start Xray');
                        }
                        const nodeResponse = response.response.response;

                        await this.nodesRepository.update({
                            uuid: node.uuid,
                            isXrayRunning: nodeResponse.isStarted,
                            xrayVersion: nodeResponse.version,
                            nodeVersion: nodeResponse.nodeInformation?.version || null,
                            isNodeOnline: true,
                            isConnected: nodeResponse.isStarted,
                            lastStatusMessage: nodeResponse.error ?? null,
                            lastStatusChange: new Date(),
                            isConnecting: false,
                            usersOnline: 0,
                            cpuCount: nodeResponse.systemInformation?.cpuCores ?? null,
                            cpuModel: nodeResponse.systemInformation?.cpuModel ?? null,
                            totalRam: nodeResponse.systemInformation?.memoryTotal ?? null,
                        });

                        return;
                }
            };

            await pMap(nodes, mapper, { concurrency: this.CONCURRENCY });

            this.logger.log(
                `Started all nodes with profile ${payload.profileUuid} in ${Date.now() - startTime}ms`,
            );
        } catch (error) {
            this.logger.error(
                `Error handling "${StartAllNodesByProfileJobNames.startAllNodesByProfile}" job: ${error}`,
            );
        } finally {
            await this.startNodeQueueService.queue.resume();
            await this.startAllNodesQueueService.queue.resume();
        }
    }

    private isUnsecureInbound(protocol: string): boolean {
        return ['dokodemo-door', 'http', 'mixed', 'wireguard'].includes(protocol);
    }
}
