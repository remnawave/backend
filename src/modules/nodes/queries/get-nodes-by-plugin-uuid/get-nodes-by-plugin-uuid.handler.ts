import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetNodesByPluginUuidQuery } from './get-nodes-by-plugin-uuid.query';
import { NodesRepository } from '../../repositories/nodes.repository';

@QueryHandler(GetNodesByPluginUuidQuery)
export class GetNodesByPluginUuidHandler implements IQueryHandler<GetNodesByPluginUuidQuery> {
    private readonly logger = new Logger(GetNodesByPluginUuidHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(query: GetNodesByPluginUuidQuery) {
        try {
            const nodeUuids = await this.nodesRepository.getNodeUuidsByPluginUuid(query.pluginUuid);

            return ok(nodeUuids);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
