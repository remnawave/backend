import allMeasures, {
    AllMeasures,
    AllMeasuresSystems,
    AllMeasuresUnits,
} from 'convert-units/definitions/all';
import configureMeasurements, { Converter } from 'convert-units';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueryBus } from '@nestjs/cqrs';

import { resolveCountryEmoji } from '@common/utils/resolve-country-emoji';
import { RuntimeMetric } from '@common/runtime-metrics/interfaces';
import { RawCacheService } from '@common/raw-cache';
import { TResult } from '@common/types';
import { INTERNAL_CACHE_KEYS, METRIC_NAMES } from '@libs/contracts/constants';

import { GetShortUserStatsQuery } from '@modules/users/queries/get-short-user-stats/get-short-user-stats.query';
import { GetAllNodesQuery } from '@modules/nodes/queries/get-all-nodes/get-all-nodes.query';
import { ShortUserStats } from '@modules/users/interfaces/user-stats.interface';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

import { INodeBaseMetricLabels } from '@scheduler/metrics-providers';
import { JOBS_INTERVALS } from '@scheduler/intervals';

@Injectable()
export class ExportMetricsTask {
    private static readonly CRON_NAME = 'exportMetrics';
    private readonly logger = new Logger(ExportMetricsTask.name);

    private convert: (
        value?: number | undefined,
    ) => Converter<AllMeasures, AllMeasuresSystems, AllMeasuresUnits, number>;

    private cachedUserStats: ShortUserStats | null;
    private lastUserStatsUpdateTime: number;
    private readonly CACHE_TTL_MS: number;

    constructor(
        private readonly rawCacheService: RawCacheService,
        @InjectMetric(METRIC_NAMES.USERS_STATUS) public usersStatus: Gauge<string>,
        @InjectMetric(METRIC_NAMES.USERS_ONLINE_STATS) public usersOnlineStats: Gauge<string>,
        @InjectMetric(METRIC_NAMES.USERS_TOTAL) public usersTotal: Gauge<string>,
        @InjectMetric(METRIC_NAMES.NODE_ONLINE_USERS) public nodeOnlineUsers: Gauge<string>,
        @InjectMetric(METRIC_NAMES.NODE_STATUS) public nodeStatus: Gauge<string>,

        @InjectMetric(METRIC_NAMES.PROCESS_RSS_BYTES)
        public processRssBytes: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_HEAP_USED_BYTES)
        public processHeapUsedBytes: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_HEAP_TOTAL_BYTES)
        public processHeapTotalBytes: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_EXTERNAL_BYTES)
        public processExternalBytes: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_ARRAY_BUFFERS_BYTES)
        public processArrayBuffersBytes: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_EVENT_LOOP_DELAY_MS)
        public processEventLoopDelayMs: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_EVENT_LOOP_P99_MS)
        public processEventLoopP99Ms: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_ACTIVE_HANDLES)
        public processActiveHandles: Gauge<string>,
        @InjectMetric(METRIC_NAMES.PROCESS_UPTIME_SECONDS)
        public processUptimeSeconds: Gauge<string>,

        private readonly queryBus: QueryBus,
    ) {
        this.lastUserStatsUpdateTime = 0;
        this.CACHE_TTL_MS = 60000;
        this.cachedUserStats = null;
        this.convert = configureMeasurements(allMeasures);
    }

    @Cron(JOBS_INTERVALS.METRIC_EXPORT_METRICS, {
        name: ExportMetricsTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.reportShortUserStats();
            await this.reportNodesStats();
            await this.reportRuntimeMetrics();
        } catch (error) {
            this.logger.error(`Error in ExportMetricsTask: ${error}`);
        }
    }

    private async reportShortUserStats() {
        try {
            const currentTime = Date.now();
            const shouldUpdateCache =
                !this.cachedUserStats ||
                currentTime - this.lastUserStatsUpdateTime > this.CACHE_TTL_MS;

            if (shouldUpdateCache) {
                // this.logger.debug('Updating user stats cache from database...');
                const usersResponse = await this.getShortUserStats();

                if (!usersResponse.isOk) {
                    return;
                }

                this.cachedUserStats = usersResponse.response;
                this.lastUserStatsUpdateTime = currentTime;

                // this.logger.debug(
                //     `User stats cache updated successfully at ${new Date().toISOString()}`,
                // );
            } else {
                // this.logger.debug('Using cached user stats (less than 1 minute old)');
            }

            if (this.cachedUserStats) {
                const stats = this.cachedUserStats;

                Object.entries(stats.statusCounts.statusCounts).forEach(([status, count]) => {
                    this.usersStatus.set({ status }, count);
                });

                Object.entries(stats.onlineStats).forEach(([metricType, value]) => {
                    this.usersOnlineStats.set({ metricType }, value);
                });

                this.usersTotal.set({ type: 'all' }, stats.statusCounts.totalUsers);

                // this.logger.debug(
                //     `Short users stats metrics updated from ${shouldUpdateCache ? 'fresh' : 'cached'} data.`,
                // );
            }
        } catch (error) {
            this.logger.error(`Error in reportShortUserStats: ${error}`);
        }
    }

    private async reportNodesStats() {
        try {
            const nodesResponse = await this.getAllNodes();
            if (!nodesResponse.isOk) {
                return;
            }

            const nodes = nodesResponse.response;

            nodes.forEach((node) => {
                this.nodeOnlineUsers.set(
                    {
                        node_uuid: node.uuid,
                        node_name: node.name,
                        node_country_emoji: resolveCountryEmoji(node.countryCode),
                        provider_name: node.provider?.name || 'unknown',
                        tags: node.tags.join(','),
                    } satisfies INodeBaseMetricLabels,
                    node.usersOnline ?? 0,
                );

                this.nodeStatus.set(
                    {
                        node_uuid: node.uuid,
                        node_name: node.name,
                        node_country_emoji: resolveCountryEmoji(node.countryCode),
                        provider_name: node.provider?.name || 'unknown',
                        tags: node.tags.join(','),
                    } satisfies INodeBaseMetricLabels,
                    node.isConnected ? 1 : 0,
                );
            });
        } catch (error) {
            this.logger.error(`Error in reportNodesStats: ${error}`);
        }
    }

    private async getShortUserStats(): Promise<TResult<ShortUserStats>> {
        return this.queryBus.execute<GetShortUserStatsQuery, TResult<ShortUserStats>>(
            new GetShortUserStatsQuery(),
        );
    }

    private async getAllNodes(): Promise<TResult<NodesEntity[]>> {
        return this.queryBus.execute<GetAllNodesQuery, TResult<NodesEntity[]>>(
            new GetAllNodesQuery(),
        );
    }

    public async reportRuntimeMetrics() {
        try {
            const raw = await this.rawCacheService.hgetallParsed<Record<string, RuntimeMetric>>(
                INTERNAL_CACHE_KEYS.RUNTIME_METRICS,
            );

            if (!raw) {
                return;
            }

            for (const m of Object.values(raw)) {
                const labels = { instance_id: m.instanceId, instance_name: m.instanceType };

                this.processRssBytes.set(labels, m.rss);
                this.processHeapUsedBytes.set(labels, m.heapUsed);
                this.processHeapTotalBytes.set(labels, m.heapTotal);
                this.processExternalBytes.set(labels, m.external);
                this.processArrayBuffersBytes.set(labels, m.arrayBuffers);
                this.processEventLoopDelayMs.set(labels, m.eventLoopDelayMs);
                this.processEventLoopP99Ms.set(labels, m.eventLoopP99Ms);
                this.processActiveHandles.set(labels, m.activeHandles);
                this.processUptimeSeconds.set(labels, m.uptime);
            }
        } catch (error) {
            this.logger.error(`Error in reportRuntimeMetrics: ${error}`);
        }
    }
}
