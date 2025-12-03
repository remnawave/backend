import { Job } from 'bullmq';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger, Scope } from '@nestjs/common';

import { AxiosService } from '@common/axios/axios.service';

import { GetPreparedConfigWithUsersQuery } from '@modules/users/queries/get-prepared-config-with-users/get-prepared-config-with-users.query';
import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';
import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';
import { NodesEntity } from '@modules/nodes';

import { NodesQueuesService } from '@queue/_nodes';

import { QUEUES_NAMES } from '../../queue.enum';
import { NODES_JOB_NAMES } from '../constants';

@Processor(
    {
        name: QUEUES_NAMES.NODES.START_ALL_BY_PROFILE,
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
        private readonly axios: AxiosService,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {
        super();
        this.CONCURRENCY = 20;
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.START_ALL_BY_PROFILE:
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
        await this.nodesQueuesService.queues.startNode.pause();
        await this.nodesQueuesService.queues.startAllNodes.pause();

        try {
            const { isOk, response: nodes } = await this.queryBus.execute(
                new FindNodesByCriteriaQuery({
                    isDisabled: false,
                    activeConfigProfileUuid: payload.profileUuid,
                }),
            );

            if (!isOk || !nodes) {
                return;
            }

            const activeInboundsOnNodes = new Map<string, ConfigProfileInboundEntity>();
            const activeNodeTags = new Map<string, string[]>();

            for (const node of nodes) {
                if (node.activeInbounds.length === 0) {
                    this.logger.warn(
                        `No active inbounds found for node ${node.uuid} with profile ${payload.profileUuid}, disabling and clearing profile from node...`,
                    );

                    await this.commandBus.execute(
                        new UpdateNodeCommand({
                            uuid: node.uuid,
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
                        nodeUuid: node.uuid,
                        isNeedToBeDeleted: false,
                    });

                    continue;
                }

                this.logger.log(
                    `Node ${node.uuid} has ${node.activeInbounds.length} active inbounds.`,
                );

                await this.commandBus.execute(
                    new UpdateNodeCommand({
                        uuid: node.uuid,
                        isConnecting: true,
                    }),
                );

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

                const filteredInboundsHashes = config.response.hashesPayload.inbounds.filter(
                    (inbound) => activeNodeInboundsTags.has(inbound.tag),
                );

                const response = await this.axios.startXray(
                    {
                        xrayConfig: {
                            ...config.response.config,
                            inbounds: config.response.config.inbounds.filter(
                                (inbound) =>
                                    activeNodeInboundsTags.has(inbound.tag) ||
                                    this.isUnsecureInbound(inbound.protocol),
                            ),
                        } as unknown as Record<string, unknown>,
                        internals: {
                            hashes: {
                                emptyConfig: config.response.hashesPayload.emptyConfig,
                                inbounds: filteredInboundsHashes,
                            },
                            forceRestart: payload.force ?? false,
                        },
                    },
                    node.address,
                    node.port,
                );

                switch (response.isOk) {
                    case false:
                        await this.commandBus.execute(
                            new UpdateNodeCommand({
                                uuid: node.uuid,
                                lastStatusMessage: response.message ?? null,
                                lastStatusChange: new Date(),
                                isConnected: false,
                                isConnecting: false,
                                usersOnline: 0,
                            }),
                        );

                        return;
                    case true:
                        if (!response.response?.response) {
                            throw new Error('Failed to start Xray');
                        }
                        const nodeResponse = response.response.response;

                        await this.commandBus.execute(
                            new UpdateNodeCommand({
                                uuid: node.uuid,
                                xrayVersion: nodeResponse.version,
                                nodeVersion: nodeResponse.nodeInformation?.version || null,
                                isConnected: nodeResponse.isStarted,
                                lastStatusMessage: nodeResponse.error ?? null,
                                lastStatusChange: new Date(),
                                isConnecting: false,
                                usersOnline: 0,
                                cpuCount: nodeResponse.systemInformation?.cpuCores ?? null,
                                cpuModel: nodeResponse.systemInformation?.cpuModel ?? null,
                                totalRam: nodeResponse.systemInformation?.memoryTotal ?? null,
                            }),
                        );

                        return;
                }
            };

            await pMap(nodes, mapper, { concurrency: this.CONCURRENCY });

            this.logger.log(
                `Started all nodes with profile ${payload.profileUuid} in ${Date.now() - startTime}ms`,
            );
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.START_ALL_BY_PROFILE}" job: ${error}`,
            );
        } finally {
            await this.nodesQueuesService.queues.startNode.resume();
            await this.nodesQueuesService.queues.startAllNodes.resume();
        }
    }

    private isUnsecureInbound(protocol: string): boolean {
        return ['dokodemo-door', 'http', 'mixed', 'wireguard'].includes(protocol);
    }
}
