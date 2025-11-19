import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueryBus } from '@nestjs/cqrs';

import { resolveCountryEmoji } from '@common/utils/resolve-country-emoji';
import { METRIC_NAMES } from '@libs/contracts/constants';

import { GetAllNodesQuery } from '@modules/nodes/queries/get-all-nodes/get-all-nodes.query';

import { INodeBandwidthMetricLabels, INodeBaseMetricLabels } from '@scheduler/metrics-providers';
import { JOBS_INTERVALS } from '@scheduler/intervals';

@Injectable()
export class SyncMetricsTask {
    private static readonly CRON_NAME = 'syncMetrics';
    private readonly logger = new Logger(SyncMetricsTask.name);

    constructor(
        @InjectMetric(METRIC_NAMES.NODE_ONLINE_USERS) public nodeOnlineUsers: Gauge<string>,
        @InjectMetric(METRIC_NAMES.NODE_STATUS) public nodeStatus: Gauge<string>,
        @InjectMetric(METRIC_NAMES.NODE_INBOUND_UPLOAD_BYTES)
        public nodeInboundUploadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_INBOUND_DOWNLOAD_BYTES)
        public nodeInboundDownloadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_OUTBOUND_UPLOAD_BYTES)
        public nodeOutboundUploadBytes: Counter<string>,
        @InjectMetric(METRIC_NAMES.NODE_OUTBOUND_DOWNLOAD_BYTES)
        public nodeOutboundDownloadBytes: Counter<string>,
        private readonly queryBus: QueryBus,
    ) {}

    @Cron(JOBS_INTERVALS.METRIC_SYNC_METRICS, {
        name: SyncMetricsTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.syncNodeMetrics();
        } catch (error) {
            this.logger.error(`Error in SyncMetricsTask: ${error}`);
        }
    }

    private async syncNodeMetrics(): Promise<void> {
        const nodesMap = new Map<string, INodeBaseMetricLabels>();

        try {
            const nodesResponse = await this.queryBus.execute(new GetAllNodesQuery());
            if (
                !nodesResponse.isOk ||
                !nodesResponse.response ||
                nodesResponse.response.length === 0
            ) {
                return;
            }

            for (const node of nodesResponse.response) {
                nodesMap.set(node.uuid, {
                    node_uuid: node.uuid,
                    node_name: node.name,
                    node_country_emoji: resolveCountryEmoji(node.countryCode),
                    provider_name: node.provider?.name || 'unknown',
                    tags: node.tags.join(','),
                });
            }

            const [
                { values: onlineUsersValues },
                { values: statusValues },
                { values: inboundUploadValues },
                { values: inboundDownloadValues },
                { values: outboundUploadValues },
                { values: outboundDownloadValues },
            ] = await Promise.all([
                this.nodeOnlineUsers.get(),
                this.nodeStatus.get(),
                this.nodeInboundUploadBytes.get(),
                this.nodeInboundDownloadBytes.get(),
                this.nodeOutboundUploadBytes.get(),
                this.nodeOutboundDownloadBytes.get(),
            ]);

            this.cleanupBaseMetrics(this.nodeOnlineUsers, onlineUsersValues, nodesMap);
            this.cleanupBaseMetrics(this.nodeStatus, statusValues, nodesMap);

            this.cleanupBandwidthMetrics(
                this.nodeInboundUploadBytes,
                inboundUploadValues,
                nodesMap,
            );
            this.cleanupBandwidthMetrics(
                this.nodeInboundDownloadBytes,
                inboundDownloadValues,
                nodesMap,
            );
            this.cleanupBandwidthMetrics(
                this.nodeOutboundUploadBytes,
                outboundUploadValues,
                nodesMap,
            );
            this.cleanupBandwidthMetrics(
                this.nodeOutboundDownloadBytes,
                outboundDownloadValues,
                nodesMap,
            );
        } catch (error) {
            this.logger.error(`Error in syncNodeMetrics: ${error}`);
        } finally {
            nodesMap.clear();
        }
    }

    private cleanupBaseMetrics(
        metric: Gauge<string>,
        values: any[],
        nodesMap: Map<string, INodeBaseMetricLabels>,
    ) {
        for (const stat of values) {
            const labels = stat.labels as INodeBaseMetricLabels;
            const existingNode = nodesMap.get(labels.node_uuid);

            if (!existingNode || !this.compareBaseLabels(existingNode, labels)) {
                metric.remove(stat.labels);
            }
        }
    }

    private cleanupBandwidthMetrics(
        metric: Counter<string>,
        values: any[],
        nodesMap: Map<string, INodeBaseMetricLabels>,
    ) {
        for (const stat of values) {
            const labels = stat.labels as INodeBandwidthMetricLabels;
            const existingNode = nodesMap.get(labels.node_uuid);

            if (!existingNode || !this.compareNodeBandwidthLabels(existingNode, labels)) {
                metric.remove(stat.labels);
            }
        }
    }

    private compareBaseLabels(nodeA: INodeBaseMetricLabels, nodeB: INodeBaseMetricLabels): boolean {
        return (
            nodeA.node_uuid === nodeB.node_uuid &&
            nodeA.node_name === nodeB.node_name &&
            nodeA.node_country_emoji === nodeB.node_country_emoji &&
            nodeA.provider_name === nodeB.provider_name &&
            nodeA.tags === nodeB.tags
        );
    }

    private compareNodeBandwidthLabels(
        existingNode: INodeBaseMetricLabels,
        metricLabels: INodeBandwidthMetricLabels,
    ): boolean {
        return (
            existingNode.node_uuid === metricLabels.node_uuid &&
            existingNode.node_name === metricLabels.node_name &&
            existingNode.node_country_emoji === metricLabels.node_country_emoji &&
            existingNode.provider_name === metricLabels.provider_name &&
            existingNode.tags === metricLabels.tags
        );
    }
}
