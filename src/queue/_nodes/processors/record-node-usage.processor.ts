import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { GetCombinedStatsCommand } from '@remnawave/node-contract';

import { AxiosService } from '@common/axios';
import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache';
import { getRedisChannelName } from '@common/utils';
import { multiplyConsumption } from '@common/utils/nano';

import { NodesUsageHistoryEntity } from '@modules/nodes-usage-history';
import { UpsertHistoryEntryCommand } from '@modules/nodes-usage-history/commands/upsert-history-entry';
import { IncrementUsedTrafficCommand } from '@modules/nodes/commands/increment-used-traffic';

import {
    INodeMetrics,
    NODE_METRICS_MESSAGE_CHANNEL,
} from '@scheduler/tasks/export-metrics/node-metrics.message.interface';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';
import { IRecordNodeUsagePayload } from '../interfaces';

@Processor(QUEUES_NAMES.NODES.RECORD_NODE_USAGE, {
    concurrency: 40,
})
export class RecordNodeUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(RecordNodeUsageQueueProcessor.name);

    private readonly nodeMetricsChannel: string;

    constructor(
        private readonly commandBus: CommandBus,
        private readonly axios: AxiosService,
        private readonly rawCacheService: RawCacheService,
        configService: TypedConfigService,
    ) {
        super();

        this.nodeMetricsChannel = getRedisChannelName(configService, NODE_METRICS_MESSAGE_CHANNEL);
    }

    async process(job: Job<IRecordNodeUsagePayload>) {
        try {
            const { nodeUuid, connectionOpts, nodeConsumptionMultiplier } = job.data;

            const combinedStats = await this.axios.getCombinedStats(
                {
                    reset: true,
                },
                connectionOpts,
            );

            if (!combinedStats.isOk) {
                this.logger.warn(
                    `Node ${nodeUuid}, ${connectionOpts.address}:${connectionOpts.port} – stats are not available, skipping`,
                );
                return;
            }

            return this.handleOk(nodeUuid, nodeConsumptionMultiplier, combinedStats.response);
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.RECORD_NODE_USAGE}" job: ${error}`,
            );

            return { isOk: false };
        }
    }

    private async handleOk(
        nodeUuid: string,
        nodeConsumptionMultiplier: string,
        combinedStats: GetCombinedStatsCommand.Response['response'],
    ): Promise<void> {
        const nodeOutboundsMetrics = new Map<
            string,
            {
                downlink: string;
                uplink: string;
            }
        >();

        const nodeInboundsMetrics = new Map<
            string,
            {
                downlink: string;
                uplink: string;
            }
        >();

        const { totalDownlink, totalUplink } = combinedStats.outbounds.reduce(
            (acc, outbound) => ({
                totalDownlink: acc.totalDownlink + (outbound.downlink || 0),
                totalUplink: acc.totalUplink + (outbound.uplink || 0),
            }),
            { totalDownlink: 0, totalUplink: 0 },
        ) || { totalDownlink: 0, totalUplink: 0 };

        if (totalDownlink === 0 && totalUplink === 0) {
            return;
        }

        const totalBytes = totalDownlink + totalUplink;
        await this.commandBus.execute(
            new UpsertHistoryEntryCommand(
                new NodesUsageHistoryEntity({
                    nodeUuid,
                    totalBytes: BigInt(totalBytes),
                    uploadBytes: BigInt(totalUplink),
                    downloadBytes: BigInt(totalDownlink),
                    createdAt: new Date(),
                }),
            ),
        );

        await this.commandBus.execute(
            new IncrementUsedTrafficCommand(
                nodeUuid,
                multiplyConsumption(nodeConsumptionMultiplier, totalBytes),
            ),
        );

        combinedStats.outbounds.forEach((outbound) => {
            nodeOutboundsMetrics.set(outbound.outbound, {
                downlink: outbound.downlink.toString(),
                uplink: outbound.uplink.toString(),
            });
        });

        combinedStats.inbounds.forEach((inbound) => {
            nodeInboundsMetrics.set(inbound.inbound, {
                downlink: inbound.downlink.toString(),
                uplink: inbound.uplink.toString(),
            });
        });

        this.sendNodeMetrics({
            nodeUuid,
            nodeOutboundsMetrics,
            nodeInboundsMetrics,
        });

        return;
    }

    private sendNodeMetrics(dto: {
        nodeUuid: string;
        nodeOutboundsMetrics: Map<string, { downlink: string; uplink: string }>;
        nodeInboundsMetrics: Map<string, { downlink: string; uplink: string }>;
    }): void {
        this.rawCacheService.publishSafe(this.nodeMetricsChannel, {
            nodeUuid: dto.nodeUuid,
            inbounds: Array.from(dto.nodeInboundsMetrics.entries()).map(([tag, metrics]) => ({
                tag,
                downlink: metrics.downlink,
                uplink: metrics.uplink,
            })),
            outbounds: Array.from(dto.nodeOutboundsMetrics.entries()).map(([tag, metrics]) => ({
                tag,
                downlink: metrics.downlink,
                uplink: metrics.uplink,
            })),
        } satisfies INodeMetrics);
    }
}
