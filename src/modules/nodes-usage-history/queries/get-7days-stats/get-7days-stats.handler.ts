import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { IGet7DaysStats } from '@modules/nodes-usage-history/interfaces';

import { NodesUsageHistoryRepository } from '../../repositories/nodes-usage-history.repository';
import { Get7DaysStatsQuery } from './get-7days-stats.query';

@QueryHandler(Get7DaysStatsQuery)
export class Get7DaysStatsHandler implements IQueryHandler<
    Get7DaysStatsQuery,
    TResult<IGet7DaysStats[]>
> {
    private readonly logger = new Logger(Get7DaysStatsHandler.name);
    constructor(private readonly nodesUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async execute(): Promise<TResult<IGet7DaysStats[]>> {
        try {
            const result = await this.nodesUsageHistoryRepository.get7DaysStats();

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
