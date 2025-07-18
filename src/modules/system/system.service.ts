import * as si from 'systeminformation';
import pm2 from 'pm2';

import { ERRORS } from '@contract/constants';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
    getCalendarMonthRanges,
    getCalendarYearRanges,
    getDateRange,
    getLast30DaysRanges,
    getLastTwoWeeksRanges,
} from '@common/utils/get-date-ranges.uti';
import { ICommandResponse } from '@common/types/command-response.type';
import { calcDiff } from '@common/utils/calc-percent-diff.util';
import { prettyBytesUtil } from '@common/utils/bytes';

import { Get7DaysStatsQuery } from '@modules/nodes-usage-history/queries/get-7days-stats';
import { CountOnlineUsersQuery } from '@modules/nodes/queries/count-online-users';
import { IGet7DaysStats } from '@modules/nodes-usage-history/interfaces';

import {
    GetBandwidthStatsResponseModel,
    GetNodesStatisticsResponseModel,
    GetRemnawaveHealthResponseModel,
    IBaseStat,
} from './models';
import { GetSumByDtRangeQuery } from '../nodes-usage-history/queries/get-sum-by-dt-range';
import { GetShortUserStatsQuery } from '../users/queries/get-short-user-stats';
import { GetStatsResponseModel } from './models/get-stats.response.model';
import { ShortUserStats } from '../users/interfaces/user-stats.interface';
import { GetStatsRequestQueryDto } from './dtos/get-stats.dto';

@Injectable()
export class SystemService {
    private readonly logger = new Logger(SystemService.name);
    constructor(private readonly queryBus: QueryBus) {}

    public async getStats(): Promise<ICommandResponse<any>> {
        try {
            const userStats = await this.getShortUserStats();
            const onlineUsers = await this.getOnlineUsers();

            if (!userStats.isOk || !userStats.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_USER_STATS_ERROR,
                };
            }

            const [cpu, mem, time] = await Promise.all([si.cpu(), si.mem(), si.time()]);

            return {
                isOk: true,
                response: new GetStatsResponseModel({
                    cpu: {
                        cores: cpu.cores,
                        physicalCores: cpu.physicalCores,
                    },
                    memory: {
                        total: mem.total,
                        free: mem.free,
                        used: mem.used,
                        active: mem.active,
                        available: mem.available,
                    },
                    uptime: time.uptime,
                    timestamp: Date.now(),
                    users: userStats.response.statusCounts,
                    onlineStats: userStats.response.onlineStats,
                    nodes: {
                        totalOnline: onlineUsers.response?.usersOnline || 0,
                    },
                }),
            };
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getBandwidthStats(
        query: GetStatsRequestQueryDto,
    ): Promise<ICommandResponse<GetBandwidthStatsResponseModel>> {
        try {
            let tz = 'UTC';
            if (query.tz) {
                tz = query.tz;
            }

            const lastTwoDaysStats = await this.getLastTwoDaysUsage(tz);
            const lastSevenDaysStats = await this.getLastSevenDaysUsage(tz);
            const last30DaysStats = await this.getLast30DaysUsage(tz);
            const calendarMonthStats = await this.getCalendarMonthUsage(tz);
            const currentYearStats = await this.getCurrentYearUsage(tz);
            return {
                isOk: true,
                response: new GetBandwidthStatsResponseModel({
                    bandwidthLastTwoDays: lastTwoDaysStats,
                    bandwidthLastSevenDays: lastSevenDaysStats,
                    bandwidthLast30Days: last30DaysStats,
                    bandwidthCalendarMonth: calendarMonthStats,
                    bandwidthCurrentYear: currentYearStats,
                }),
            };
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getNodesStatistics(): Promise<ICommandResponse<GetNodesStatisticsResponseModel>> {
        try {
            const lastSevenDaysStats = await this.getLastSevenDaysNodesUsage();

            if (!lastSevenDaysStats.isOk || !lastSevenDaysStats.response) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            return {
                isOk: true,
                response: new GetNodesStatisticsResponseModel({
                    lastSevenDays: lastSevenDaysStats.response,
                }),
            };
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getRemnawaveHealth(): Promise<ICommandResponse<GetRemnawaveHealthResponseModel>> {
        try {
            const list = await new Promise<pm2.ProcessDescription[]>((resolve, reject) => {
                pm2.list((err, processes) => {
                    if (err) {
                        this.logger.error('Error getting PM2 processes:', err);
                        reject(err);
                    } else {
                        resolve(processes);
                    }
                });
            });

            const instanceType: Record<string, string> = {
                'remnawave-api': 'REST API',
                'remnawave-scheduler': 'Scheduler',
                'remnawave-jobs': 'Jobs',
            };

            const stats = new Map<string, { memory: string; cpu: string; name: string }>();

            for (const process of list) {
                if (process.pm2_env) {
                    if ('INSTANCE_ID' in process.pm2_env) {
                        stats.set(`${process.name}-${process.pm2_env.INSTANCE_ID}`, {
                            memory: prettyBytesUtil(process.monit?.memory || 0),
                            cpu: process.monit?.cpu?.toString() || '0',
                            name: `${instanceType[process.name || 'unknown'] || process.name}-${process.pm2_env.INSTANCE_ID || '0'}`,
                        });
                    }
                }
            }

            return {
                isOk: true,
                response: new GetRemnawaveHealthResponseModel({
                    pm2Stats: Array.from(stats.values()),
                }),
            };
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return {
                isOk: true,
                response: new GetRemnawaveHealthResponseModel({
                    pm2Stats: [],
                }),
            };
        }
    }

    private async getShortUserStats(): Promise<ICommandResponse<ShortUserStats>> {
        return this.queryBus.execute<GetShortUserStatsQuery, ICommandResponse<ShortUserStats>>(
            new GetShortUserStatsQuery(),
        );
    }

    private async getOnlineUsers(): Promise<ICommandResponse<{ usersOnline: number }>> {
        return this.queryBus.execute<
            CountOnlineUsersQuery,
            ICommandResponse<{ usersOnline: number }>
        >(new CountOnlineUsersQuery());
    }

    private async getLastSevenDaysNodesUsage(): Promise<ICommandResponse<IGet7DaysStats[]>> {
        return this.queryBus.execute<Get7DaysStatsQuery, ICommandResponse<IGet7DaysStats[]>>(
            new Get7DaysStatsQuery(),
        );
    }

    private async getNodesUsageByDtRange(
        query: GetSumByDtRangeQuery,
    ): Promise<ICommandResponse<bigint>> {
        return this.queryBus.execute<GetSumByDtRangeQuery, ICommandResponse<bigint>>(
            new GetSumByDtRangeQuery(query.start, query.end),
        );
    }

    private async getUsageComparison(dateRanges: [[Date, Date], [Date, Date]]): Promise<{
        current: string;
        difference: string;
        previous: string;
    }> {
        const [[previousStart, previousEnd], [currentStart, currentEnd]] = dateRanges;

        const [nodesCurrentUsage, nodesPreviousUsage] = await Promise.all([
            this.getNodesUsageByDtRange({
                start: currentStart,
                end: currentEnd,
            }),
            this.getNodesUsageByDtRange({
                start: previousStart,
                end: previousEnd,
            }),
        ]);

        const currentUsage = nodesCurrentUsage.response || 0n;
        const previousUsage = nodesPreviousUsage.response || 0n;

        const [cur, prev, diff] = calcDiff(currentUsage, previousUsage);

        return {
            current: prettyBytesUtil(cur),
            previous: prettyBytesUtil(prev),
            difference: prettyBytesUtil(diff),
        };
    }

    private async getLastTwoDaysUsage(tz: string): Promise<IBaseStat> {
        const today = getDateRange(tz);
        const yesterday = getDateRange(tz, 1);
        return this.getUsageComparison([yesterday, today]);
    }

    private async getLastSevenDaysUsage(tz: string): Promise<IBaseStat> {
        const ranges = getLastTwoWeeksRanges(tz);
        return this.getUsageComparison(ranges);
    }

    private async getLast30DaysUsage(tz: string): Promise<IBaseStat> {
        const ranges = getLast30DaysRanges(tz);
        return this.getUsageComparison(ranges);
    }
    private async getCalendarMonthUsage(tz: string): Promise<IBaseStat> {
        const ranges = getCalendarMonthRanges(tz);
        return this.getUsageComparison(ranges);
    }

    private async getCurrentYearUsage(tz: string): Promise<IBaseStat> {
        const ranges = getCalendarYearRanges(tz);
        return this.getUsageComparison(ranges);
    }
}
