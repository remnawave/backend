import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';

import { getDateRangeArrayUtil } from '@common/utils';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesUsageHistoryRepository } from './repositories/nodes-usage-history.repository';
import { GetStatsNodesUsageResponseModel } from './models';

@Injectable()
export class NodesUsageHistoryService {
    private readonly logger = new Logger(NodesUsageHistoryService.name);
    constructor(private readonly nodeUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async getStatsNodesUsage(
        start: string,
        end: string,
        topNodesLimit: number,
    ): Promise<TResult<GetStatsNodesUsageResponseModel>> {
        try {
            const { startDate, endDate, dates } = getDateRangeArrayUtil(
                dayjs.utc(start).startOf('day').toDate(),
                dayjs.utc(end).endOf('day').toDate(),
            );

            const dailyTraffic = await this.nodeUsageHistoryRepository.getDailyTrafficSum(
                startDate,
                endDate,
                dates,
            );

            const topNodes = await this.nodeUsageHistoryRepository.getTopNodesByTraffic(
                startDate,
                endDate,
                topNodesLimit,
            );

            const nodesUsage = await this.nodeUsageHistoryRepository.getNodesUsageByRange(
                startDate,
                endDate,
                dates,
            );

            return ok(
                new GetStatsNodesUsageResponseModel({
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
}
