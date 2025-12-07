import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesUserUsageHistoryRepository } from './repositories/nodes-user-usage-history.repository';
import { IGetNodesRealtimeUsage, IGetNodeUserUsageByRange } from './interfaces';

@Injectable()
export class NodesUserUsageHistoryService {
    private readonly logger = new Logger(NodesUserUsageHistoryService.name);
    constructor(private readonly nodeUserUsageHistoryRepository: NodesUserUsageHistoryRepository) {}

    public async getNodesUserUsageByRange(
        uuid: string,
        start: Date,
        end: Date,
    ): Promise<TResult<IGetNodeUserUsageByRange[]>> {
        try {
            const startDate = dayjs(start).utc().toDate();
            const endDate = dayjs(end).utc().toDate();

            const result = await this.nodeUserUsageHistoryRepository.getNodeUsersUsageByRange(
                uuid,
                startDate,
                endDate,
            );

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_NODES_USER_USAGE_BY_RANGE_ERROR);
        }
    }

    public async getNodesRealtimeUsage(): Promise<TResult<IGetNodesRealtimeUsage[]>> {
        try {
            const result = await this.nodeUserUsageHistoryRepository.getNodesRealtimeUsage();

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_NODES_REALTIME_USAGE_ERROR);
        }
    }
}
