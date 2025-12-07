import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { IGetUserUsageByRange } from '@modules/users/interfaces';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { GetUserUsageByRangeQuery } from './get-user-usage-by-range.query';

@QueryHandler(GetUserUsageByRangeQuery)
export class GetUserUsageByRangeHandler implements IQueryHandler<
    GetUserUsageByRangeQuery,
    TResult<IGetUserUsageByRange[]>
> {
    private readonly logger = new Logger(GetUserUsageByRangeHandler.name);
    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute(query: GetUserUsageByRangeQuery): Promise<TResult<IGetUserUsageByRange[]>> {
        try {
            const result = await this.nodesUserUsageHistoryRepository.getUserUsageByRange(
                query.userUuid,
                query.start,
                query.end,
            );

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
