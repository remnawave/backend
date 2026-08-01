import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NodePluginSchema } from 'libs/node-plugins';
import { nanoid } from 'nanoid';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { GetTorrentBlockerReportsCommand } from '@libs/contracts/commands';
import { ERRORS } from '@libs/contracts/constants';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { GetNodesByPluginUuidQuery } from '@modules/nodes/queries/get-nodes-by-plugin-uuid';

import { NodesQueuesService } from '@queue/_nodes';

import { EXAMPLE_NODE_PLUGIN_CONFIG } from './constants';
import { PluginExecutorBodyDto } from './dtos';
import { ExtendedTorrentBlockerReportEntity } from './entities';
import { NodePluginEntity } from './entities/node-plugin.entity';
import {
    BaseNodePluginResponseModel,
    GetNodePluginsResponseModel,
    TorrentBlockerReportsStatsResponseModel,
} from './models';
import {} from './models/base-node-plugin.response.model';
import { NodePluginRepository } from './repositories/node-plugins.repository';
import { TorrentBlockerReportsRepository } from './repositories/torrent-blocker-report.repository';

@Injectable()
export class NodePluginService {
    private readonly logger = new Logger(NodePluginService.name);

    constructor(
        private readonly nodePluginRepository: NodePluginRepository,
        private readonly nodeQueuesService: NodesQueuesService,
        private readonly torrentBlockerReportsRepository: TorrentBlockerReportsRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async getAllConfigs(): Promise<TResult<GetNodePluginsResponseModel>> {
        try {
            const nodePlugins = await this.nodePluginRepository.getAllNodePlugins(false);

            return ok(new GetNodePluginsResponseModel(nodePlugins, nodePlugins.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_NODE_PLUGINS_ERROR);
        }
    }

    public async getConfigByUuid(uuid: string): Promise<TResult<BaseNodePluginResponseModel>> {
        try {
            const nodePlugin = await this.nodePluginRepository.findByUUID(uuid);

            if (!nodePlugin) {
                return fail(ERRORS.NODE_PLUGIN_NOT_FOUND);
            }

            return ok(new BaseNodePluginResponseModel(nodePlugin));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_NODE_PLUGIN_BY_UUID_ERROR);
        }
    }

    public async updateConfig(
        uuid: string,
        name: string | undefined,
        inputConfig: object | undefined,
    ): Promise<TResult<BaseNodePluginResponseModel>> {
        try {
            const nodePlugin = await this.nodePluginRepository.findByUUID(uuid);

            if (!nodePlugin) {
                return fail(ERRORS.NODE_PLUGIN_NOT_FOUND);
            }

            if (inputConfig) {
                const validatedConfig = await NodePluginSchema.safeParseAsync(inputConfig);

                if (!validatedConfig.success) {
                    const errorMessage = validatedConfig.error.issues
                        .map(
                            (err) =>
                                `${err.path.length ? `${err.path.join('.')}: ` : ''}${err.message}`,
                        )
                        .join(', ');
                    this.logger.error(errorMessage);
                    return fail(ERRORS.INVALID_NODE_PLUGIN_CONFIG.withMessage(errorMessage));
                }

                inputConfig = validatedConfig.data;
            }

            const updatedConfig = await this.nodePluginRepository.update({
                uuid: nodePlugin.uuid,
                name: name ?? undefined,
                pluginConfig: inputConfig ?? undefined,
            });

            await this.syncNodePlugins(nodePlugin.uuid);

            return ok(new BaseNodePluginResponseModel(updatedConfig));
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'NodePlugin' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.NODE_PLUGIN_NAME_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.UPDATE_NODE_PLUGIN_ERROR);
        }
    }

    public async deleteConfig(uuid: string): Promise<TResult<boolean>> {
        try {
            const nodePlugin = await this.nodePluginRepository.findByUUID(uuid);

            if (!nodePlugin) {
                return fail(ERRORS.NODE_PLUGIN_NOT_FOUND);
            }

            const nodeUuids = await this.queryBus.execute(
                new GetNodesByPluginUuidQuery(nodePlugin.uuid),
            );

            await this.nodePluginRepository.deleteByUUID(uuid);

            if (nodeUuids.isOk && nodeUuids.response.length > 0) {
                await this.nodeQueuesService.syncNodePluginsBulk(
                    nodeUuids.response.map((nodeUuid) => ({ nodeUuid })),
                );
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async createConfig(name: string): Promise<TResult<BaseNodePluginResponseModel>> {
        try {
            const nodePluginEntity = new NodePluginEntity({
                name,
                pluginConfig: EXAMPLE_NODE_PLUGIN_CONFIG,
            });

            const nodePlugin = await this.nodePluginRepository.create(nodePluginEntity);

            return ok(new BaseNodePluginResponseModel(nodePlugin));
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'NodePlugin' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.NODE_PLUGIN_NAME_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.CREATE_NODE_PLUGIN_ERROR);
        }
    }

    public async reorderNodePlugins(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<TResult<GetNodePluginsResponseModel>> {
        try {
            await this.nodePluginRepository.reorderMany(dto);

            return await this.getAllConfigs();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GENERIC_REORDER_ERROR);
        }
    }

    public async cloneNodePlugin(
        cloneFromUuid: string,
    ): Promise<TResult<BaseNodePluginResponseModel>> {
        try {
            const nodePlugin = await this.nodePluginRepository.findByUUID(cloneFromUuid);

            if (!nodePlugin) {
                return fail(ERRORS.NODE_PLUGIN_NOT_FOUND);
            }

            const newNodePlugin = await this.nodePluginRepository.create(
                new NodePluginEntity({
                    name: `Clone ${nanoid(5)}`,
                    pluginConfig: nodePlugin.pluginConfig,
                }),
            );

            return ok(new BaseNodePluginResponseModel(newNodePlugin));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_NODE_PLUGIN_ERROR);
        }
    }

    private async syncNodePlugins(pluginUuid: string): Promise<void> {
        const nodeUuids = await this.queryBus.execute(new GetNodesByPluginUuidQuery(pluginUuid));

        if (nodeUuids.isOk && nodeUuids.response.length > 0) {
            await this.nodeQueuesService.syncNodePluginsBulk(
                nodeUuids.response.map((nodeUuid) => ({ nodeUuid })),
            );
        }

        return;
    }

    public async executePluginCommand(dto: PluginExecutorBodyDto): Promise<TResult<boolean>> {
        try {
            const findResult = await this.queryBus.execute(
                new FindNodesByCriteriaQuery({
                    isDisabled: false,
                    isConnected: true,
                    isConnecting: false,
                }),
            );

            if (!findResult.isOk || findResult.response.length === 0) {
                return fail(ERRORS.CONNECTED_NODES_NOT_FOUND);
            }

            let nodes: NodesEntity[] = [];

            if (dto.targetNodes.target === 'allNodes') {
                nodes = findResult.response;
            } else {
                const { nodeUuids } = dto.targetNodes;
                nodes = findResult.response.filter((node) => nodeUuids.includes(node.uuid));
            }

            if (nodes.length === 0) {
                return fail(ERRORS.CONNECTED_NODES_NOT_FOUND);
            }

            switch (dto.command.command) {
                case 'blockIps':
                    for (const node of nodes) {
                        await this.nodeQueuesService.blockIps({
                            data: {
                                ips: dto.command.ips,
                            },
                            node: {
                                address: node.address,
                                port: node.port,
                                proxyUrl: node.proxyUrl,
                            },
                        });
                    }
                    break;
                case 'unblockIps':
                    for (const node of nodes) {
                        await this.nodeQueuesService.unblockIps({
                            data: {
                                ips: dto.command.ips,
                            },
                            node: {
                                address: node.address,
                                port: node.port,
                                proxyUrl: node.proxyUrl,
                            },
                        });
                    }
                    break;
                case 'recreateTables':
                    for (const node of nodes) {
                        await this.nodeQueuesService.recreateTables({
                            node: {
                                address: node.address,
                                port: node.port,
                                proxyUrl: node.proxyUrl,
                            },
                        });
                    }
                    break;
                default:
                    this.logger.error(`Invalid command: ${dto.command}`);
                    return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getTorrentBlockerReports(
        dto: GetTorrentBlockerReportsCommand.RequestQuery,
    ): Promise<
        TResult<{
            total: number;
            records: ExtendedTorrentBlockerReportEntity[];
        }>
    > {
        try {
            const [records, total] = await this.torrentBlockerReportsRepository.getAllReports(dto);

            return ok({
                records,
                total,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_TORRENT_BLOCKER_REPORTS_ERROR);
        }
    }

    public async truncateTorrentBlockerReports(): Promise<TResult<boolean>> {
        try {
            await this.torrentBlockerReportsRepository.truncateReports();
            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getTorrentBlockerReportsStats(): Promise<
        TResult<TorrentBlockerReportsStatsResponseModel>
    > {
        try {
            const stats = await this.torrentBlockerReportsRepository.getStats();
            const topUsers = await this.torrentBlockerReportsRepository.getTopTorrentBlockerUsers();
            const topNodes = await this.torrentBlockerReportsRepository.getTopTorrentBlockerNodes();
            return ok(new TorrentBlockerReportsStatsResponseModel({ stats, topUsers, topNodes }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
