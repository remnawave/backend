import parsePrometheusTextFormat from 'parse-prometheus-text-format';
import { createHappCryptoLink } from '@kastov/cryptohapp';
import { generateKeyPair } from '@stablelib/x25519';
import { encodeURLSafe } from '@stablelib/base64';
import { Request, Response } from 'express';
import { readPackageJSON } from 'pkg-types';
import axios, { AxiosError } from 'axios';
import { groupBy } from 'lodash';
import dayjs from 'dayjs';
import os from 'node:os';

import { ERRORS, INTERNAL_CACHE_KEYS } from '@contract/constants';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
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
import { RuntimeMetric } from '@common/runtime-metrics/interfaces';
import { calcDiff } from '@common/utils/calc-percent-diff.util';
import { prettyBytesUtil } from '@common/utils/bytes';
import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';

import { ResponseRulesMatcherService } from '@modules/subscription-response-rules/services/response-rules-matcher.service';
import { ResponseRulesParserService } from '@modules/subscription-response-rules/services/response-rules-parser.service';
import { GetSumLifetimeQuery } from '@modules/nodes-usage-history/queries/get-sum-lifetime';
import { Get7DaysStatsQuery } from '@modules/nodes-usage-history/queries/get-7days-stats';
import { GetInitDateQuery } from '@modules/remnawave-settings/queries/get-init-date';
import { CountOnlineUsersQuery } from '@modules/nodes/queries/count-online-users';
import { GetUsersRecapQuery } from '@modules/users/queries/get-users-recap';
import { GetNodesRecapQuery } from '@modules/nodes/queries/get-nodes-recap';
import { IGet7DaysStats } from '@modules/nodes-usage-history/interfaces';
import { GetAllNodesQuery } from '@modules/nodes/queries/get-all-nodes';

import {
    GenerateX25519ResponseModel,
    GetBandwidthStatsResponseModel,
    GetMetadataResponseModel,
    GetNodesStatisticsResponseModel,
    GetNodesStatsResponseModel,
    GetRecapResponseModel,
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

const TYPE_ORDER: Record<string, number> = {
    api: 0,
    scheduler: 1,
    processor: 2,
};

@Injectable()
export class SystemService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SystemService.name);
    private rwVersion: string;

    constructor(
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly srrParser: ResponseRulesParserService,
        private readonly srrMatcher: ResponseRulesMatcherService,
        private readonly rawCacheService: RawCacheService,
    ) {}

    public async onApplicationBootstrap(): Promise<void> {
        const { version } = await readPackageJSON();
        this.rwVersion = version || this.configService.getOrThrow<string>('__RW_METADATA_VERSION');
    }

    public async getMetadata(): Promise<TResult<GetMetadataResponseModel>> {
        try {
            return ok(
                new GetMetadataResponseModel({
                    version: this.rwVersion,
                    backendCommitSha: this.configService.getOrThrow<string>(
                        '__RW_METADATA_GIT_BACKEND_COMMIT',
                    ),
                    frontendCommitSha: this.configService.getOrThrow<string>(
                        '__RW_METADATA_GIT_FRONTEND_COMMIT',
                    ),
                    branch: this.configService.getOrThrow<string>('__RW_METADATA_GIT_BRANCH'),
                    buildTime: this.configService.getOrThrow<string>('__RW_METADATA_BUILD_TIME'),
                    buildNumber: this.configService.getOrThrow<string>(
                        '__RW_METADATA_BUILD_NUMBER',
                    ),
                }),
            );
        } catch (error) {
            this.logger.error('Error getting system metadata:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getStats(): Promise<TResult<GetStatsResponseModel>> {
        try {
            const userStats = await this.getShortUserStats();
            const onlineUsers = await this.queryBus.execute(new CountOnlineUsersQuery());
            const nodesSumLifetime = await this.queryBus.execute(new GetSumLifetimeQuery());

            if (!userStats.isOk || !nodesSumLifetime.isOk || !onlineUsers.isOk) {
                return fail(ERRORS.GET_USER_STATS_ERROR);
            }

            const cpus = os.cpus();

            return ok(
                new GetStatsResponseModel({
                    cpu: {
                        cores: cpus.length,
                    },
                    memory: {
                        total: os.totalmem(),
                        free: os.freemem(),
                        used: os.totalmem() - os.freemem(),
                    },
                    uptime: os.uptime(),
                    timestamp: Date.now(),
                    users: userStats.response.statusCounts,
                    onlineStats: userStats.response.onlineStats,
                    nodes: {
                        totalOnline: onlineUsers.response.usersOnline,
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
            const runtimeMetrics = await this.rawCacheService.hgetallParsed<
                Record<string, RuntimeMetric>
            >(INTERNAL_CACHE_KEYS.RUNTIME_METRICS);

            if (!runtimeMetrics) {
                return ok(new GetRemnawaveHealthResponseModel([]));
            }

            return ok(
                new GetRemnawaveHealthResponseModel(
                    Object.values(runtimeMetrics).sort((a, b) => {
                        const typeA = TYPE_ORDER[a.instanceType] ?? 99;
                        const typeB = TYPE_ORDER[b.instanceType] ?? 99;
                        if (typeA !== typeB) return typeA - typeB;
                        return Number(a.instanceId) - Number(b.instanceId);
                    }),
                ),
            );
        } catch (error) {
            this.logger.error('Error getting system stats:', error);
            return ok(new GetRemnawaveHealthResponseModel([]));
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

            const nodeMetrics = await this.groupMetricsByNodes(parsed);

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
        const encryptedLink = createHappCryptoLink(linkToEncrypt, 'v4', true);

        if (!encryptedLink) {
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }

        return ok(encryptedLink);
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

    public async getRecap(): Promise<TResult<GetRecapResponseModel>> {
        try {
            const now = dayjs().utc();

            const usersRecap = await this.queryBus.execute(new GetUsersRecapQuery());
            const nodesRecap = await this.queryBus.execute(new GetNodesRecapQuery());

            const nuhLifetimeRecap = await this.queryBus.execute(new GetSumLifetimeQuery());
            const nuhThisMonthRecap = await this.queryBus.execute(
                new GetSumByDtRangeQuery(
                    now.startOf('month').toDate(),
                    now.endOf('month').toDate(),
                ),
            );
            const initDate = await this.queryBus.execute(new GetInitDateQuery());
            if (
                !usersRecap.isOk ||
                !nodesRecap.isOk ||
                !nuhLifetimeRecap.isOk ||
                !nuhThisMonthRecap.isOk
            ) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }
            const { total, newUsersThisMonth } = usersRecap.response;

            return ok(
                new GetRecapResponseModel({
                    thisMonth: {
                        users: newUsersThisMonth,
                        traffic: nuhThisMonthRecap.response.toString(),
                    },
                    total: {
                        users: total,
                        nodes: nodesRecap.response.total,
                        traffic: nuhLifetimeRecap.response.totalBytes.toString(),
                        nodesRam: nodesRecap.response.totalRam.toString(),
                        nodesCpuCores: nodesRecap.response.totalCpuCores,
                        distinctCountries: nodesRecap.response.distinctCountries,
                    },
                    version: this.rwVersion,
                    initDate: initDate,
                }),
            );
        } catch (error) {
            this.logger.error('Error getting system recap:', error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    private async getShortUserStats(): Promise<TResult<ShortUserStats>> {
        return this.queryBus.execute<GetShortUserStatsQuery, TResult<ShortUserStats>>(
            new GetShortUserStatsQuery(),
        );
    }

    private async getLastSevenDaysNodesUsage(): Promise<TResult<IGet7DaysStats[]>> {
        return this.queryBus.execute<Get7DaysStatsQuery, TResult<IGet7DaysStats[]>>(
            new Get7DaysStatsQuery(),
        );
    }

    private async getUsageComparison(dateRanges: [[Date, Date], [Date, Date]]): Promise<{
        current: string;
        difference: string;
        previous: string;
    }> {
        const [[previousStart, previousEnd], [currentStart, currentEnd]] = dateRanges;

        const [nodesCurrentUsage, nodesPreviousUsage] = await Promise.all([
            this.queryBus.execute(new GetSumByDtRangeQuery(currentStart, currentEnd)),
            this.queryBus.execute(new GetSumByDtRangeQuery(previousStart, previousEnd)),
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

    private async groupMetricsByNodes(metrics: Metric[]): Promise<NodeMetrics[]> {
        const nodes = await this.queryBus.execute(new GetAllNodesQuery());
        if (!nodes.isOk) {
            return [];
        }

        const nodesMap = new Map(nodes.response.map((node) => [node.uuid, node]));

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

        const groupedByNode = groupBy(allMetrics, (item) => item.labels.node_uuid);

        const nodeMetrics = Object.entries(groupedByNode)
            .filter(([uuid]) => nodesMap.has(uuid))
            .map(([uuid, nodeMetrics]) => {
                const node = nodesMap.get(uuid)!;

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
                    nodeUuid: node.uuid,
                    nodeName: node.name,
                    countryEmoji: resolveCountryEmoji(node.countryCode),
                    providerName: node.provider?.name || 'unknown',
                    usersOnline: metricGroups.onlineUsers,
                    inboundsStats,
                    outboundsStats,
                };
            })
            .filter((node) => node.inboundsStats.length > 0 || node.outboundsStats.length > 0);

        return nodeMetrics.sort((a, b) => {
            const nodeA = nodesMap.get(a.nodeUuid);
            const nodeB = nodesMap.get(b.nodeUuid);
            return (nodeA?.viewPosition ?? 0) - (nodeB?.viewPosition ?? 0);
        });
    }
}
