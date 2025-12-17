import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetNodesUsageByRangeResponseModel } from './models/get-nodes-usage-by-range.response.model';
import { NodesUsageHistoryRepository } from './repositories/nodes-usage-history.repository';

@Injectable()
export class NodesUsageHistoryService {
    private readonly logger = new Logger(NodesUsageHistoryService.name);
    constructor(private readonly nodeUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async getNodesUsageByRange(
        start: Date,
        end: Date,
    ): Promise<TResult<GetNodesUsageByRangeResponseModel>> {
        try {
            const startDate = dayjs(start).utc().startOf('day').toDate();
            const endDate = dayjs(end).utc().endOf('day').toDate();

            const dates = this.generateDateArray(startDate, endDate);

            const dailyTraffic = await this.nodeUsageHistoryRepository.getDailyTrafficSum(
                startDate,
                endDate,
                dates,
            );

            const topNodes = await this.nodeUsageHistoryRepository.getTopNodesByTraffic(
                startDate,
                endDate,
            );

            const nodesUsage = await this.nodeUsageHistoryRepository.getNodesUsageByRange(
                startDate,
                endDate,
                dates,
            );

            return ok(
                new GetNodesUsageByRangeResponseModel({
                    categories: dates,
                    series: nodesUsage,
                    sparklineData: dailyTraffic,
                    topNodes: topNodes,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    private generateDateArray(start: Date, end: Date): string[] {
        const startDate = dayjs(start).utc().startOf('day');
        const endDate = dayjs(end).utc().startOf('day');
        const days = endDate.diff(startDate, 'day') + 1;

        return Array.from({ length: days }, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'));
    }
}
