import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesSystemCacheService } from '@modules/nodes/nodes-system-cache.service';

import { NodesRepository } from '../../repositories/nodes.repository';
import { CountOnlineUsersQuery } from './count-online-users.query';

@QueryHandler(CountOnlineUsersQuery)
export class CountOnlineUsersHandler implements IQueryHandler<CountOnlineUsersQuery> {
    private readonly logger = new Logger(CountOnlineUsersHandler.name);
    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesSystemCacheService: NodesSystemCacheService,
    ) {}

    async execute() {
        try {
            const nodes = await this.nodesRepository.findConnectedNodesPartial();
            const usersOnline = await this.nodesSystemCacheService.getTotalOnlineUsers(nodes);

            return ok({ usersOnline });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
