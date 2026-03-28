import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodePluginRepository } from '../../repositories/node-plugins.repository';
import { NodePluginEntity } from '../../entities/node-plugin.entity';
import { GetPluginByUuidQuery } from './get-plugin-by-uuid.query';

@QueryHandler(GetPluginByUuidQuery)
export class GetPluginByUuidHandler implements IQueryHandler<
    GetPluginByUuidQuery,
    TResult<NodePluginEntity>
> {
    private readonly logger = new Logger(GetPluginByUuidHandler.name);
    constructor(private readonly nodePluginsRepository: NodePluginRepository) {}

    async execute(query: GetPluginByUuidQuery): Promise<TResult<NodePluginEntity>> {
        try {
            const nodePlugin = await this.nodePluginsRepository.findByUUID(query.uuid);

            if (!nodePlugin) {
                return fail(ERRORS.NODE_PLUGIN_NOT_FOUND);
            }

            return ok(nodePlugin);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_NODE_PLUGIN_BY_UUID_ERROR);
        }
    }
}
