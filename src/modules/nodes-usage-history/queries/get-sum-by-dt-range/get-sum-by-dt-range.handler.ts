import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesUsageHistoryRepository } from '../../repositories/nodes-usage-history.repository';
import { GetSumByDtRangeQuery } from './get-sum-by-dt-range.query';

@QueryHandler(GetSumByDtRangeQuery)
export class GetSumByDtRangeHandler implements IQueryHandler<
    GetSumByDtRangeQuery,
    TResult<bigint>
> {
    private readonly logger = new Logger(GetSumByDtRangeHandler.name);
    constructor(private readonly nodesUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async execute(query: GetSumByDtRangeQuery): Promise<TResult<bigint>> {
        try {
            const sum = await this.nodesUsageHistoryRepository.getStatsByDatetimeRange(
                query.start,
                query.end,
            );

            return {
                isOk: true,
                response: sum,
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
