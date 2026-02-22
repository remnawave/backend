import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { getDateRangeArrayUtil } from '@common/utils/get-date-range-array.util';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';

import { NodesQueuesService } from '@queue/_nodes';

import {
    IGetLegacyStatsNodesUsersUsage,
    IGetLegacyStatsUserUsage,
    IGetNodesRealtimeUsage,
} from './interfaces';
import {
    CreateUserIpsJobResponseModel,
    GetUserIpsResultResponseModel,
} from './models/get-user-ips.response.model';
import { NodesUserUsageHistoryRepository } from './repositories/nodes-user-usage-history.repository';
import { GetStatsNodesUsersUsageResponseModel, GetStatsUserUsageResponseModel } from './models';

@Injectable()
export class NodesUserUsageHistoryService {
    private readonly logger = new Logger(NodesUserUsageHistoryService.name);
    constructor(
        private readonly nodeUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
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

    public async getStatsUserUsage(
        uuid: string,
        start: string,
        end: string,
        topNodesLimit: number,
    ): Promise<TResult<GetStatsUserUsageResponseModel>> {
        try {
            const user = await this.queryBus.execute(new GetUserByUniqueFieldQuery({ uuid }));
            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const { startDate, endDate, dates } = getDateRangeArrayUtil(
                dayjs.utc(start).startOf('day').toDate(),
                dayjs.utc(end).endOf('day').toDate(),
            );

            const dailyTraffic = await this.nodeUserUsageHistoryRepository.getUserDailyTrafficSum(
                user.response.tId,
                startDate,
                endDate,
                dates,
            );

            const topNodes = await this.nodeUserUsageHistoryRepository.getTopUserNodesByTraffic(
                user.response.tId,
                startDate,
                endDate,
                topNodesLimit,
            );

            const nodesUsage = await this.nodeUserUsageHistoryRepository.getUserNodesUsageByRange(
                user.response.tId,
                startDate,
                endDate,
                dates,
            );

            return ok(
                new GetStatsUserUsageResponseModel({
                    categories: dates,
                    series: nodesUsage,
                    sparklineData: dailyTraffic,
                    topNodes: topNodes,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_USAGE_BY_RANGE_ERROR);
        }
    }

    public async getStatsNodesUsersUsage(
        nodeUuid: string,
        start: string,
        end: string,
        topUsersLimit: number,
    ): Promise<TResult<GetStatsNodesUsersUsageResponseModel>> {
        try {
            const node = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));
            if (!node.isOk) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const { startDate, endDate, dates } = getDateRangeArrayUtil(
                dayjs.utc(start).startOf('day').toDate(),
                dayjs.utc(end).endOf('day').toDate(),
            );

            const dailyTraffic = await this.nodeUserUsageHistoryRepository.getNodeDailyTrafficSum(
                node.response.id,
                startDate,
                endDate,
                dates,
            );

            const topUsers = await this.nodeUserUsageHistoryRepository.getTopNodeUsersByTraffic(
                node.response.id,
                startDate,
                endDate,
                topUsersLimit,
            );

            return ok(
                new GetStatsNodesUsersUsageResponseModel({
                    categories: dates,
                    sparklineData: dailyTraffic,
                    topUsers: topUsers,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_USAGE_BY_RANGE_ERROR);
        }
    }

    public async createUserIpsJob(
        userUuid: string,
    ): Promise<TResult<CreateUserIpsJobResponseModel>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery({ uuid: userUuid }),
            );
            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const result = await this.nodesQueuesService.queryNodes({
                userId: user.response.tId.toString(),
                userUuid: userUuid,
            });

            if (!result) {
                return fail(ERRORS.JOB_CREATION_FAILED);
            }

            return ok(new CreateUserIpsJobResponseModel({ jobId: result.jobId }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_CREATION_FAILED);
        }
    }

    public async getUserIpsResult(jobId: string): Promise<TResult<GetUserIpsResultResponseModel>> {
        try {
            const result = await this.nodesQueuesService.getIpsListResult(jobId);
            if (!result) {
                return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
            }

            return ok(new GetUserIpsResultResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
        }
    }
}
