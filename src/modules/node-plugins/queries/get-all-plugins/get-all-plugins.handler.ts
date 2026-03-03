import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodePluginRepository } from '../../repositories/node-plugins.repository';
import { NodePluginEntity } from '../../entities/node-plugin.entity';
import { GetAllPluginsQuery } from './get-all-plugins.query';

@QueryHandler(GetAllPluginsQuery)
export class GetAllPluginsHandler implements IQueryHandler<
    GetAllPluginsQuery,
    TResult<NodePluginEntity[]>
> {
    private readonly logger = new Logger(GetAllPluginsHandler.name);
    constructor(private readonly nodePluginsRepository: NodePluginRepository) {}

    async execute(query: GetAllPluginsQuery): Promise<TResult<NodePluginEntity[]>> {
        try {
            const nodePlugins = await this.nodePluginsRepository.getAllNodePlugins(
                query.withContent,
            );

            return ok(nodePlugins);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_NODE_PLUGINS_ERROR);
        }
    }
}
