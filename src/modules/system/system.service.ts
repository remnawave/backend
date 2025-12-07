import parsePrometheusTextFormat from 'parse-prometheus-text-format';
import { generateKeyPair } from '@stablelib/x25519';
import { encodeURLSafe } from '@stablelib/base64';
import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import * as si from 'systeminformation';
import { groupBy } from 'lodash';
import pm2 from 'pm2';

import { ERRORS } from '@contract/constants';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';

import {
    getCalendarMonthRanges,
    getCalendarYearRanges,
    getDateRange,
    getLast30DaysRanges,
    getLastTwoWeeksRanges,
} from '@common/utils/get-date-ranges.uti';
import { resolveCountryEmoji } from '@common/utils/resolve-country-emoji';
import { createHappCryptoLink } from '@common/utils/happ-crypto-link';
import { calcDiff } from '@common/utils/calc-percent-diff.util';
import { prettyBytesUtil } from '@common/utils/bytes';
import { fail, ok, TResult } from '@common/types';

import { ResponseRulesMatcherService } from '@modules/subscription-response-rules/services/response-rules-matcher.service';
import { ResponseRulesParserService } from '@modules/subscription-response-rules/services/response-rules-parser.service';
import { GetSumLifetimeQuery } from '@modules/nodes-usage-history/queries/get-sum-lifetime';
import { Get7DaysStatsQuery } from '@modules/nodes-usage-history/queries/get-7days-stats';
import { CountOnlineUsersQuery } from '@modules/nodes/queries/count-online-users';
import { IGet7DaysStats } from '@modules/nodes-usage-history/interfaces';
import { GetAllNodesQuery } from '@modules/nodes/queries/get-all-nodes';

import {
    GenerateX25519ResponseModel,
    GetBandwidthStatsResponseModel,
    GetNodesStatisticsResponseModel,
    GetNodesStatsResponseModel,
    GetRemnawaveHealthResponseModel,
    IBaseStat,
} from './models';
import { GetSumByDtRangeQuery } from '../nodes-usage-history/queries/get-sum-by-dt-range';
import { InboundStats, Metric, NodeMetrics, OutboundStats } from './interfaces';
import { GetShortUserStatsQuery } from '../users/queries/get-short-user-stats';
import { GetStatsResponseModel } from './models/get-stats.response.model';
import { ShortUserStats } from '../users/interfaces/user-stats.interface';
import { GetStatsRequestQueryDto } from './dtos/get-stats.dto';
import { DebugSrrMatcherRequestDto } from './dtos';

@Injectable()
export class SystemService {
    private readonly logger = new Logger(SystemService.name);
    constructor(
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly srrParser: ResponseRulesParserService,
        private readonly srrMatcher: ResponseRulesMatcherService,
    ) {}

    public async getStats(): Promise<TResult<GetStatsResponseModel>> {
        try {
            const userStats = await this.getShortUserStats();
            const onlineUsers = await this.getOnlineUsers();
            const nodesSumLifetime = await this.queryBus.execute(new GetSumLifetimeQuery());

            if (!userStats.isOk || !nodesSumLifetime.isOk || !onlineUsers.isOk) {
                return fail(ERRORS.GET_USER_STATS_ERROR);
            }

            const [cpu, mem, time] = await Promise.all([si.cpu(), si.mem(), si.time()]);

            return ok(
                new GetStatsResponseModel({
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
                        totalBytesLifetime: nodesSumLifetime.response.totalBytes,
                    },
                }),
            );
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getBandwidthStats(
        query: GetStatsRequestQueryDto,
    ): Promise<TResult<GetBandwidthStatsResponseModel>> {
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
            return ok(
                new GetBandwidthStatsResponseModel({
                    bandwidthLastTwoDays: lastTwoDaysStats,
                    bandwidthLastSevenDays: lastSevenDaysStats,
                    bandwidthLast30Days: last30DaysStats,
                    bandwidthCalendarMonth: calendarMonthStats,
                    bandwidthCurrentYear: currentYearStats,
                }),
            );
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getNodesStatistics(): Promise<TResult<GetNodesStatisticsResponseModel>> {
        try {
            const lastSevenDaysStats = await this.getLastSevenDaysNodesUsage();

            if (!lastSevenDaysStats.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            return ok(
                new GetNodesStatisticsResponseModel({
                    lastSevenDays: lastSevenDaysStats.response,
                }),
            );
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getRemnawaveHealth(): Promise<TResult<GetRemnawaveHealthResponseModel>> {
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

            return ok(
                new GetRemnawaveHealthResponseModel({
                    pm2Stats: Array.from(stats.values()),
                }),
            );
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return ok(
                new GetRemnawaveHealthResponseModel({
                    pm2Stats: [],
                }),
            );
        }
    }

    public async getNodesMetrics(): Promise<TResult<GetNodesStatsResponseModel>> {
        try {
            const metricPort = this.configService.getOrThrow<string>('METRICS_PORT');
            const username = this.configService.getOrThrow<string>('METRICS_USER');
            const password = this.configService.getOrThrow<string>('METRICS_PASS');
            const metricsText = await axios.get(`http://127.0.0.1:${metricPort}/metrics`, {
                auth: {
                    username,
                    password,
                },
            });

            const parsed = parsePrometheusTextFormat(metricsText.data);

            const nodeMetrics = await this.groupMetricsByNodesLodash(parsed);

            return ok(new GetNodesStatsResponseModel({ nodes: nodeMetrics }));
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    'Error in Axios Get Nodes Metrics Request:',
                    JSON.stringify(error.message),
                );

                return ok(new GetNodesStatsResponseModel({ nodes: [] }));
            }

            this.logger.error('Error getting nodes metrics:', error);

            return ok(new GetNodesStatsResponseModel({ nodes: [] }));
        }
    }

    public async getX25519Keypairs(): Promise<TResult<GenerateX25519ResponseModel>> {
        try {
            const generateAmount = 30;
            const keypairs: { publicKey: string; privateKey: string }[] = [];

            for (let i = 0; i < generateAmount; i++) {
                const keypair = generateKeyPair();
                keypairs.push({
                    publicKey: encodeURLSafe(keypair.publicKey)
                        .replace(/=/g, '')
                        .replace(/\n/g, ''),
                    privateKey: encodeURLSafe(keypair.secretKey)
                        .replace(/=/g, '')
                        .replace(/\n/g, ''),
                });
            }

            return ok(new GenerateX25519ResponseModel(keypairs));
        } catch (error) {
            this.logger.error('Error getting x25519 keypairs:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async encryptHappCryptoLink(linkToEncrypt: string): Promise<TResult<string>> {
        try {
            const encryptedLink = createHappCryptoLink(linkToEncrypt);
            return ok(encryptedLink);
        } catch (error) {
            this.logger.error('Error encrypting happ crypto link:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async debugSrrMatcher(
        request: Request,
        response: Response,
        body: DebugSrrMatcherRequestDto,
    ): Promise<Response> {
        try {
            const parsedResponseRules = await this.srrParser.parseConfig(body.responseRules);

            const inputHeaders = request.headers;

            const result = this.srrMatcher.matchRules(parsedResponseRules, inputHeaders, undefined);

            const responseBody = {
                matched: result.matched,
                matchedRule: result.matchedRule,
                responseType: result.responseType,
                inputHeaders,
                outputHeaders: result.matchedRule?.responseModifications?.headers || [],
            };

            return response.status(200).json({
                response: responseBody,
            });
        } catch (error) {
            if (error instanceof Error) {
                return response.status(500).json({
                    error: 'Internal server error',
                    message: error.message,
                });
            } else {
                return response.status(500).json({
                    error: 'Internal server error',
                    message: 'Unknown error',
                });
            }
        }
    }

    private async getShortUserStats(): Promise<TResult<ShortUserStats>> {
        return this.queryBus.execute<GetShortUserStatsQuery, TResult<ShortUserStats>>(
            new GetShortUserStatsQuery(),
        );
    }

    private async getOnlineUsers(): Promise<TResult<{ usersOnline: number }>> {
        return this.queryBus.execute<CountOnlineUsersQuery, TResult<{ usersOnline: number }>>(
            new CountOnlineUsersQuery(),
        );
    }

    private async getLastSevenDaysNodesUsage(): Promise<TResult<IGet7DaysStats[]>> {
        return this.queryBus.execute<Get7DaysStatsQuery, TResult<IGet7DaysStats[]>>(
            new Get7DaysStatsQuery(),
        );
    }

    private async getNodesUsageByDtRange(query: GetSumByDtRangeQuery): Promise<TResult<bigint>> {
        return this.queryBus.execute<GetSumByDtRangeQuery, TResult<bigint>>(
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

        const currentUsage = nodesCurrentUsage.isOk ? nodesCurrentUsage.response : 0n;
        const previousUsage = nodesPreviousUsage.isOk ? nodesPreviousUsage.response : 0n;

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

    private async groupMetricsByNodesLodash(metrics: Metric[]): Promise<NodeMetrics[]> {
        const nodes = await this.queryBus.execute(new GetAllNodesQuery());
        if (!nodes.isOk) {
            return [];
        }

        const createNodeKey = (...parts: string[]) => parts.join('§');

        const nodesMap = new Map(
            nodes.response.map((node) => {
                const key = createNodeKey(
                    node.uuid,
                    node.name,
                    resolveCountryEmoji(node.countryCode),
                    node.provider?.name || 'unknown',
                );
                return [key, node];
            }),
        );

        const validMetrics = [
            'remnawave_node_online_users',
            'remnawave_node_inbound_upload_bytes',
            'remnawave_node_inbound_download_bytes',
            'remnawave_node_outbound_upload_bytes',
            'remnawave_node_outbound_download_bytes',
        ];

        const filteredMetrics = metrics.filter((metric) => validMetrics.includes(metric.name));

        const allMetrics = filteredMetrics.flatMap((metric) =>
            metric.metrics.map((m) => ({
                metricName: metric.name,
                ...m,
            })),
        );

        const groupedByNode = groupBy(allMetrics, (item) =>
            createNodeKey(
                item.labels.node_uuid,
                item.labels.node_name,
                item.labels.node_country_emoji,
                item.labels.provider_name,
            ),
        );

        const nodeMetrics = Object.entries(groupedByNode)
            .filter(([key]) => nodesMap.has(key))
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(([_, nodeMetrics]) => {
                const firstMetric = nodeMetrics[0];
                const {
                    node_uuid: nodeUuid,
                    node_name: nodeName,
                    node_country_emoji: countryEmoji,
                    provider_name: providerName,
                } = firstMetric.labels;

                const metricGroups = {
                    onlineUsers: 0,
                    inboundUpload: new Map<string, number>(),
                    inboundDownload: new Map<string, number>(),
                    outboundUpload: new Map<string, number>(),
                    outboundDownload: new Map<string, number>(),
                };

                for (const metric of nodeMetrics) {
                    const value = parseFloat(metric.value) || 0;
                    const tag = metric.labels.tag;

                    switch (metric.metricName) {
                        case 'remnawave_node_online_users':
                            metricGroups.onlineUsers = value;
                            break;
                        case 'remnawave_node_inbound_upload_bytes':
                            metricGroups.inboundUpload.set(tag, value);
                            break;
                        case 'remnawave_node_inbound_download_bytes':
                            metricGroups.inboundDownload.set(tag, value);
                            break;
                        case 'remnawave_node_outbound_upload_bytes':
                            metricGroups.outboundUpload.set(tag, value);
                            break;
                        case 'remnawave_node_outbound_download_bytes':
                            metricGroups.outboundDownload.set(tag, value);
                            break;
                    }
                }

                const allInboundTags = new Set([
                    ...metricGroups.inboundDownload.keys(),
                    ...metricGroups.inboundUpload.keys(),
                ]);
                const allOutboundTags = new Set([
                    ...metricGroups.outboundDownload.keys(),
                    ...metricGroups.outboundUpload.keys(),
                ]);

                const inboundsStats: InboundStats[] = Array.from(allInboundTags, (tag) => ({
                    tag,
                    upload: prettyBytesUtil(metricGroups.inboundUpload.get(tag) || 0),
                    download: prettyBytesUtil(metricGroups.inboundDownload.get(tag) || 0),
                })).sort((a, b) => a.tag.localeCompare(b.tag));

                const outboundsStats: OutboundStats[] = Array.from(allOutboundTags, (tag) => ({
                    tag,
                    upload: prettyBytesUtil(metricGroups.outboundUpload.get(tag) || 0),
                    download: prettyBytesUtil(metricGroups.outboundDownload.get(tag) || 0),
                })).sort((a, b) => a.tag.localeCompare(b.tag));

                return {
                    nodeUuid,
                    nodeName,
                    countryEmoji,
                    providerName,
                    usersOnline: metricGroups.onlineUsers,
                    inboundsStats,
                    outboundsStats,
                };
            })
            .filter((node) => node.inboundsStats.length > 0 || node.outboundsStats.length > 0);

        return nodeMetrics.sort((a, b) => {
            const nodeA = nodesMap.get(
                createNodeKey(a.nodeUuid, a.nodeName, a.countryEmoji, a.providerName),
            );
            const nodeB = nodesMap.get(
                createNodeKey(b.nodeUuid, b.nodeName, b.countryEmoji, b.providerName),
            );

            const viewPositionA = nodeA?.viewPosition ?? 0;
            const viewPositionB = nodeB?.viewPosition ?? 0;

            return viewPositionA - viewPositionB;
        });
    }
}
