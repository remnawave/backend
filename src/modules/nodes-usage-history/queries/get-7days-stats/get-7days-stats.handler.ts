import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { IGet7DaysStats } from '@modules/nodes-usage-history/interfaces';

import { NodesUsageHistoryRepository } from '../../repositories/nodes-usage-history.repository';
import { Get7DaysStatsQuery } from './get-7days-stats.query';

@QueryHandler(Get7DaysStatsQuery)
export class Get7DaysStatsHandler implements IQueryHandler<
    Get7DaysStatsQuery,
    ICommandResponse<IGet7DaysStats[]>
> {
    private readonly logger = new Logger(Get7DaysStatsHandler.name);
    constructor(private readonly nodesUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async execute(): Promise<ICommandResponse<IGet7DaysStats[]>> {
        try {
            const result = await this.nodesUsageHistoryRepository.get7DaysStats();

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
