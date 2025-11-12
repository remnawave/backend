import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ERRORS } from '@libs/contracts/constants';

import { NodesUsageHistoryRepository } from '../../repositories/nodes-usage-history.repository';
import { GetSumLifetimeQuery } from './get-sum-lifetime.query';

@QueryHandler(GetSumLifetimeQuery)
export class GetSumLifetimeHandler implements IQueryHandler<GetSumLifetimeQuery> {
    private readonly logger = new Logger(GetSumLifetimeHandler.name);
    constructor(private readonly nodesUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async execute() {
        try {
            const sum = await this.nodesUsageHistoryRepository.getSumLifetime();

            return {
                isOk: true,
                response: {
                    totalBytes: sum,
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
