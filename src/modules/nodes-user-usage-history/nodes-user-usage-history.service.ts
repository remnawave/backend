import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import {
    IGetLegacyStatsNodesUsersUsage,
    IGetLegacyStatsUserUsage,
    IGetNodesRealtimeUsage,
} from './interfaces';
import { NodesUserUsageHistoryRepository } from './repositories/nodes-user-usage-history.repository';

@Injectable()
export class NodesUserUsageHistoryService {
    private readonly logger = new Logger(NodesUserUsageHistoryService.name);
    constructor(
        private readonly nodeUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * @deprecated This method is deprecated and may be removed in future versions.
     */
    public async getLegacyStatsNodesUsersUsage(
        uuid: string,
        start: Date,
        end: Date,
    ): Promise<TResult<IGetLegacyStatsNodesUsersUsage[]>> {
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

    /**
     * @deprecated This method is deprecated and may be removed in future versions.
     */
    public async getLegacyStatsUserUsage(
        uuid: string,
        start: Date,
        end: Date,
    ): Promise<TResult<IGetLegacyStatsUserUsage[]>> {
        try {
            const user = await this.queryBus.execute(new GetUserByUniqueFieldQuery({ uuid }));
            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }
            const result = await this.nodeUserUsageHistoryRepository.getLegacyStatsUserUsage(
                user.response.tId,
                start,
                end,
            );
            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_USAGE_BY_RANGE_ERROR);
        }
    }

    public async getStatsNodesRealtimeUsage(): Promise<TResult<IGetNodesRealtimeUsage[]>> {
        try {
            const result = await this.nodeUserUsageHistoryRepository.getNodesRealtimeUsage();

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_NODES_REALTIME_USAGE_ERROR);
        }
    }
}
