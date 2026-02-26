import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { nanoid } from 'nanoid';

import { NodePluginSchema } from 'libs/node-plugins';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetNodesByPluginUuidQuery } from '@modules/nodes/queries/get-nodes-by-plugin-uuid';

import { NodesQueuesService } from '@queue/_nodes';

import {
    DeleteNodePluginResponseModel,
    BaseNodePluginResponseModel,
    GetNodePluginsResponseModel,
} from './models';
import { NodePluginRepository } from './repositories/node-plugins.repository';
import { NodePluginEntity } from './entities/node-plugin.entity';
import {} from './models/base-node-plugin.response.model';
import { EXAMPLE_NODE_PLUGIN_CONFIG } from './constants';

@Injectable()
export class NodePluginService {
    private readonly logger = new Logger(NodePluginService.name);

    constructor(
        private readonly nodePluginRepository: NodePluginRepository,
        private readonly nodeQueuesService: NodesQueuesService,
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
                    this.logger.error(
                        validatedConfig.error.errors
                            .map(
                                (err) =>
                                    `${err.path.length ? `${err.path.join('.')}: ` : ''}${err.message}`,
                            )
                            .join(', '),
                    );
                    return fail(ERRORS.INVALID_NODE_PLUGIN_CONFIG);
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

    public async deleteConfig(uuid: string): Promise<TResult<DeleteNodePluginResponseModel>> {
        try {
            const nodePlugin = await this.nodePluginRepository.findByUUID(uuid);

            if (!nodePlugin) {
                return fail(ERRORS.NODE_PLUGIN_NOT_FOUND);
            }

            const nodeUuids = await this.queryBus.execute(
                new GetNodesByPluginUuidQuery(nodePlugin.uuid),
            );

            const deletedConfig = await this.nodePluginRepository.deleteByUUID(uuid);

            if (nodeUuids.isOk && nodeUuids.response.length > 0) {
                await this.nodeQueuesService.syncNodePluginsBulk(
                    nodeUuids.response.map((nodeUuid) => ({ nodeUuid })),
                );
            }

            return ok(new DeleteNodePluginResponseModel(deletedConfig));
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
}
