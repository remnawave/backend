import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { ShortUserStats } from '../../interfaces/user-stats.interface';
import { GetShortUserStatsQuery } from './get-short-user-stats.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetShortUserStatsQuery)
export class GetShortUserStatsHandler implements IQueryHandler<
    GetShortUserStatsQuery,
    TResult<ShortUserStats>
> {
    private readonly logger = new Logger(GetShortUserStatsHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(): Promise<TResult<ShortUserStats>> {
        try {
            const statusCounts = await this.usersRepository.getUserStats();
            const onlineStats = await this.usersRepository.getUserOnlineStats();

            return {
                isOk: true,
                response: {
                    statusCounts,
                    onlineStats,
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
