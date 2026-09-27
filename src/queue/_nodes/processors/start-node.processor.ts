import { Job } from 'bullmq';
import semver from 'semver';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AxiosService } from '@common/axios/axios.service';
import { RawCacheService } from '@common/raw-cache';
import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';
import { CACHE_KEYS, CACHE_KEYS_TTL, EVENTS, INTERNAL_CACHE_KEYS } from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { GetResolvedIntegrationsQuery } from '@modules/node-integrations/queries/get-resolved-integrations';
import { mergeNodeIntegrations } from '@modules/node-integrations/utils';
import { GetPluginByUuidQuery } from '@modules/node-plugins/queries/get-plugin-by-uuid';
import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';
import { getNodeConnectionState, NodesConnectionState } from '@modules/nodes/entities/nodes.entity';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';
import { GetPreparedConfigWithUsersQuery } from '@modules/users/queries/get-prepared-config-with-users';

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
        private readonly rawCacheService: RawCacheService,
    ) {
        super();
    }

    async process(job: Job<{ nodeUuid: string; force?: boolean; healthCheck?: boolean }>) {
        let connectingState: NodesConnectionState | undefined;
        try {
            const { nodeUuid, force, healthCheck } = job.data;

            // Automatic recovery leaves connection state to the statistics monitor.
            // Starting Xray successfully does not prove its statistics API recovered.
            const connectionStatus = (isConnected: boolean, lastStatusMessage: null | string) =>
                healthCheck ? {} : { isConnected, lastStatusMessage, lastStatusChange: new Date() };

            const nodeCheckup = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));

            if (!nodeCheckup.isOk) {
                this.logger.error(`Node ${nodeUuid} not found`);
                return;
            }

            const { response: node } = nodeCheckup;

            if (node.isConnecting || (healthCheck && node.isDisabled)) {
                return;
            }

            const syncPendingKey = INTERNAL_CACHE_KEYS.NODE_HEALTH_CHECK_SYNC_PENDING(nodeUuid);
            if (healthCheck) {
                await this.rawCacheService.set(syncPendingKey, true);
            }

            await this.rawCacheService.delMany([
                CACHE_KEYS.NODE_SYSTEM_STATS(nodeUuid),
                CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                CACHE_KEYS.NODE_XRAY_UPTIME(nodeUuid),
            ]);

            if (node.activeInbounds.length === 0 || !node.activeConfigProfileUuid) {
                this.logger.warn(
                    `Node ${nodeUuid} has no active config profile or inbounds, disabling and clearing profile from node...`,
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
                    }),
                );

                await this.nodesQueuesService.stopNode({
                    nodeUuid: node.uuid,
                    isNeedToBeDeleted: false,
                });

                return;
            }

            const connectingResult = await this.commandBus.execute(
                new UpdateNodeCommand(
                    { uuid: node.uuid, isConnecting: true },
                    healthCheck ? getNodeConnectionState(node) : undefined,
                ),
            );

            if (!connectingResult.isOk) {
                return;
            }

            if (healthCheck) {
                connectingState = { ...getNodeConnectionState(node), isConnecting: true };
            }

            const xrayStatusResponse = await this.axios.getNodeHealth({
                address: node.address,
                port: node.port,
                proxyUrl: node.proxyUrl,
            });

            if (!xrayStatusResponse.isOk) {
                await this.commandBus.execute(
                    new UpdateNodeCommand(
                        {
                            uuid: node.uuid,
                            ...connectionStatus(false, xrayStatusResponse.message ?? null),
                            isConnecting: false,
                        },
                        connectingState,
                    ),
                );

                this.logger.error(
                    `Pre-check failed. Node: ${node.uuid} – ${node.address}:${node.port}, error: ${xrayStatusResponse.message}`,
                );

                return;
            }

            if (semver.lt(xrayStatusResponse.response.nodeVersion, '2.7.0')) {
                await this.commandBus.execute(
                    new UpdateNodeCommand(
                        {
                            uuid: node.uuid,
                            ...connectionStatus(
                                false,
                                `Outdated version ${xrayStatusResponse.response.nodeVersion} of Remnawave Node. Please upgrade to the latest version (>= 2.7.0).`,
                            ),
                            isConnecting: false,
                        },
                        connectingState,
                    ),
                );

                this.logger.error(
                    `Outdated version ${xrayStatusResponse.response.nodeVersion} of Remnawave Node. Please upgrade to the latest version (>= 2.7.0).`,
                );

                return;
            }

            let plugin: {
                uuid: string;
                config: Record<string, unknown>;
                name: string;
            } | null = null;

            if (node.activePluginUuid) {
                const getNodePluginResult = await this.queryBus.execute(
                    new GetPluginByUuidQuery(node.activePluginUuid),
                );

                if (!getNodePluginResult.isOk) {
                    this.logger.error(`Failed to get node plugin: ${getNodePluginResult.message}`);
                    return;
                }
                const { response: nodePlugin } = getNodePluginResult;
                plugin = {
                    uuid: nodePlugin.uuid,
                    config: nodePlugin.pluginConfig as Record<string, unknown>,
                    name: nodePlugin.name,
                };
            }

            const syncNodePluginsResponse = await this.axios.syncNodePlugins(
                {
                    plugin,
                },
                {
                    address: node.address,
                    port: node.port,
                    proxyUrl: node.proxyUrl,
                },
            );

            if (!syncNodePluginsResponse.isOk) {
                await this.commandBus.execute(
                    new UpdateNodeCommand(
                        {
                            uuid: node.uuid,
                            isConnecting: false,
                            ...connectionStatus(
                                false,
                                `Failed to sync node plugins: ${syncNodePluginsResponse.message}`,
                            ),
                        },
                        connectingState,
                    ),
                );

                this.logger.error(
                    `Failed to sync node plugins: ${syncNodePluginsResponse.message}`,
                );
                return;
            }

            const startTime = getTime();
            const config = await this.queryBus.execute(
                new GetPreparedConfigWithUsersQuery(
                    node.activeConfigProfileUuid,
                    node.activeInbounds,
                ),
            );

            this.logger.log(`Generated config for node in ${formatExecutionTime(startTime)}`);

            if (!config.isOk) {
                throw new Error('Failed to get config for node');
            }

            const integrationsResult = await this.queryBus.execute(
                new GetResolvedIntegrationsQuery(node.integrationUuids),
            );

            if (!integrationsResult.isOk) {
                throw new Error('Failed to resolve integrations for node');
            }

            const nodeIntegrations = mergeNodeIntegrations(
                node.integrationUuids
                    .map((uuid) => integrationsResult.response.get(uuid))
                    .filter((integration) => integration !== undefined),
            );

            const reqStartTime = getTime();

            const startNodeResult = await this.axios.startXray(
                {
                    xrayConfig: config.response.config as unknown as Record<string, unknown>,
                    internals: {
                        hashes: config.response.hashesPayload,
                        forceRestart: force ?? false,
                        metadata: {
                            uuid: node.uuid,
                            name: node.name,
                            countryCode: node.countryCode,
                            id: Number(node.id),
                            tags: node.tags,
                        },
                        integrations: nodeIntegrations,
                    },
                },
                {
                    address: node.address,
                    port: node.port,
                    proxyUrl: node.proxyUrl,
                },
            );

            this.logger.log(`Started node in ${formatExecutionTime(reqStartTime)}`);

            if (!startNodeResult.isOk) {
                await this.commandBus.execute(
                    new UpdateNodeCommand(
                        {
                            uuid: node.uuid,
                            ...connectionStatus(false, startNodeResult.message ?? null),
                            isConnecting: false,
                        },
                        connectingState,
                    ),
                );

                return;
            }

            const nodeResponse = startNodeResult.response;

            await this.rawCacheService.setMany([
                {
                    key: CACHE_KEYS.NODE_SYSTEM_INFO(node.uuid),
                    value: nodeResponse.system.info,
                },
                {
                    key: CACHE_KEYS.NODE_VERSIONS(node.uuid),
                    value:
                        nodeResponse.nodeInformation.version && nodeResponse.version
                            ? {
                                  xray: nodeResponse.version,
                                  node: nodeResponse.nodeInformation.version,
                              }
                            : null,
                },
                {
                    key: CACHE_KEYS.NODE_SYSTEM_STATS(node.uuid),
                    value: nodeResponse.system.stats,
                    ttlSeconds: CACHE_KEYS_TTL.NODE_SYSTEM_STATS,
                },
            ]);

            const updateNodeResult = await this.commandBus.execute(
                new UpdateNodeCommand(
                    {
                        uuid: node.uuid,
                        ...connectionStatus(nodeResponse.isStarted, nodeResponse.error ?? null),
                        isConnecting: false,
                    },
                    connectingState,
                ),
            );

            if (!updateNodeResult.isOk) {
                this.logger.error(`Failed to update node ${node.uuid}`);
                return;
            }

            connectingState = undefined;

            if (nodeResponse.isStarted && (node.isConnected || !healthCheck)) {
                await this.rawCacheService.del(syncPendingKey);
            }

            if (!healthCheck && !node.isConnected && nodeResponse.isStarted) {
                this.eventEmitter.emit(
                    EVENTS.NODE.CONNECTION_RESTORED,
                    new NodeEvent(updateNodeResult.response, EVENTS.NODE.CONNECTION_RESTORED),
                );
            }

            return;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.START_NODE}" job: ${error}`);
        } finally {
            // Early returns and exceptions must not leave automatic recovery stuck
            // in isConnecting, which would exclude the node from future checks.
            if (connectingState) {
                await this.commandBus.execute(
                    new UpdateNodeCommand(
                        { uuid: job.data.nodeUuid, isConnecting: false },
                        {
                            // An endpoint edit invalidates the result, but the old
                            // operation still owns this connecting flag until it exits.
                            isConnecting: true,
                            isConnected: connectingState.isConnected,
                            isDisabled: connectingState.isDisabled,
                            lastStatusChange: connectingState.lastStatusChange,
                        },
                    ),
                );
            }
        }
    }
}
