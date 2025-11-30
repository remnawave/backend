import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { IGetUserUsageByRange } from '@modules/users/interfaces';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { GetUserUsageByRangeQuery } from './get-user-usage-by-range.query';

@QueryHandler(GetUserUsageByRangeQuery)
export class GetUserUsageByRangeHandler implements IQueryHandler<
    GetUserUsageByRangeQuery,
    ICommandResponse<IGetUserUsageByRange[]>
> {
    private readonly logger = new Logger(GetUserUsageByRangeHandler.name);
    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute(
        query: GetUserUsageByRangeQuery,
    ): Promise<ICommandResponse<IGetUserUsageByRange[]>> {
        try {
            const result = await this.nodesUserUsageHistoryRepository.getUserUsageByRange(
                query.userUuid,
                query.start,
                query.end,
            );

            return {
                isOk: true,
                response: result,
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
