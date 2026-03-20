import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesSystemCacheService } from '@modules/nodes/nodes-system-cache.service';

import { GetNodesSystemStatsQuery } from './get-nodes-system-stats.query';

@QueryHandler(GetNodesSystemStatsQuery)
export class GetNodesSystemStatsHandler implements IQueryHandler<GetNodesSystemStatsQuery> {
    private readonly logger = new Logger(GetNodesSystemStatsHandler.name);
    constructor(private readonly nodesSystemCacheService: NodesSystemCacheService) {}

    async execute(query: GetNodesSystemStatsQuery) {
        try {
            const nodes = await this.nodesSystemCacheService.getMany(query.nodes);

            return ok(nodes);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
