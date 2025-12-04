import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { CountOnlineUsersQuery } from './count-online-users.query';

@QueryHandler(CountOnlineUsersQuery)
export class CountOnlineUsersHandler implements IQueryHandler<
    CountOnlineUsersQuery,
    TResult<{ usersOnline: number }>
> {
    private readonly logger = new Logger(CountOnlineUsersHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(): Promise<TResult<{ usersOnline: number }>> {
        try {
            const nodes = await this.nodesRepository.countOnlineUsers();

            return {
                isOk: true,
                response: {
                    usersOnline: nodes,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
