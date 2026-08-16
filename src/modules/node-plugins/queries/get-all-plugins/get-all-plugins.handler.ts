import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodePluginEntity } from '../../entities/node-plugin.entity';
import { NodePluginRepository } from '../../repositories/node-plugins.repository';
import { SharedListsRepository } from '../../repositories/shared-lists.repository';
import { injectSharedLists } from '../../utils';
import { GetAllPluginsQuery } from './get-all-plugins.query';

@QueryHandler(GetAllPluginsQuery)
export class GetAllPluginsHandler implements IQueryHandler<
    GetAllPluginsQuery,
    TResult<NodePluginEntity[]>
> {
    private readonly logger = new Logger(GetAllPluginsHandler.name);
    constructor(
        private readonly nodePluginsRepository: NodePluginRepository,
        private readonly sharedListsRepository: SharedListsRepository,
    ) {}

    async execute(query: GetAllPluginsQuery): Promise<TResult<NodePluginEntity[]>> {
        try {
            const nodePlugins = await this.nodePluginsRepository.getAllNodePlugins(
                query.withContent,
            );

            if (!query.withContent) {
                return ok(nodePlugins);
            }

            const sharedLists = await this.sharedListsRepository.getAllSharedLists();

            for (const nodePlugin of nodePlugins) {
                nodePlugin.pluginConfig = injectSharedLists(nodePlugin.pluginConfig, sharedLists);
            }

            return ok(nodePlugins);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_NODE_PLUGINS_ERROR);
        }
    }
}
