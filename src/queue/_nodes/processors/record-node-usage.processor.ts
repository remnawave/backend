import { Job } from 'bullmq';

import { IMessageBus, MessageBus, RoutingMessage } from '@nestjstools/messaging';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { GetAllInboundsStatsCommand, GetAllOutboundsStatsCommand } from '@remnawave/node-contract';

import { ICommandResponse } from '@common/types/command-response.type';
import { AxiosService } from '@common/axios';
import { MessagingBuses, MessagingMessages } from '@libs/contracts/constants';

import { UpsertHistoryEntryCommand } from '@modules/nodes-usage-history/commands/upsert-history-entry';
import { IncrementUsedTrafficCommand } from '@modules/nodes/commands/increment-used-traffic';
import { NodesUsageHistoryEntity } from '@modules/nodes-usage-history';

import { NodeMetricsMessage } from '@scheduler/tasks/export-metrics/node-metrics.message.interface';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';
import { IRecordNodeUsagePayload } from '../interfaces';

@Processor(QUEUES_NAMES.NODES.RECORD_NODE_USAGE, {
    concurrency: 40,
})
export class RecordNodeUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(RecordNodeUsageQueueProcessor.name);

    constructor(
        @MessageBus(MessagingBuses.EVENT) private readonly messageBus: IMessageBus,
        private readonly commandBus: CommandBus,
        private readonly axios: AxiosService,
    ) {
        super();
    }

    async process(job: Job<IRecordNodeUsagePayload>) {
        try {
            const { nodeUuid, nodeAddress, nodePort } = job.data;

            const outboundsStats = await this.axios.getAllOutboundStats(
                {
                    reset: true,
                },
                nodeAddress,
                nodePort,
            );

            const inboundsStats = await this.axios.getAllInboundStats(
                {
                    reset: true,
                },
                nodeAddress,
                nodePort,
            );

            if (outboundsStats.isOk && inboundsStats.isOk) {
                return this.handleOk(nodeUuid, outboundsStats.response!, inboundsStats.response!);
            }

            if (outboundsStats.isOk && !inboundsStats.isOk) {
                this.logger.error(
                    `Failed to get inbound stats, node: ${nodeUuid} – ${nodeAddress}:${nodePort}, error: ${JSON.stringify(inboundsStats)}`,
                );
                return;
            }

            if (!outboundsStats.isOk && inboundsStats.isOk) {
                this.logger.error(
                    `Failed to get outbound stats, node: ${nodeUuid} – ${nodeAddress}:${nodePort}, error: ${JSON.stringify(outboundsStats)}`,
                );
                return;
            }

            this.logger.warn(
                `Node ${nodeUuid}, ${nodeAddress}:${nodePort} – stats are not available, skipping`,
            );

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.RECORD_NODE_USAGE}" job: ${error}`,
            );

            return { isOk: false };
        }
    }

    private async handleOk(
        nodeUuid: string,
        outboundsResponse: GetAllOutboundsStatsCommand.Response,
        inboundsResponse: GetAllInboundsStatsCommand.Response,
    ): Promise<void> {
        const nodeOutBoundsMetrics = new Map<
            string,
            {
                downlink: string;
                uplink: string;
            }
        >();

        const nodeInBoundsMetrics = new Map<
            string,
            {
                downlink: string;
                uplink: string;
            }
        >();

        const { totalDownlink, totalUplink } = outboundsResponse.response.outbounds?.reduce(
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

        await this.reportUsageHistory({
            nodeUsageHistory: new NodesUsageHistoryEntity({
                nodeUuid,
                totalBytes: BigInt(totalBytes),
                uploadBytes: BigInt(totalUplink),
                downloadBytes: BigInt(totalDownlink),
                createdAt: new Date(),
            }),
        });

        await this.incrementUsedTraffic({
            nodeUuid,
            bytes: BigInt(totalBytes),
        });

        outboundsResponse.response.outbounds?.forEach((outbound) => {
            nodeOutBoundsMetrics.set(outbound.outbound, {
                downlink: outbound.downlink.toString(),
                uplink: outbound.uplink.toString(),
            });
        });

        inboundsResponse.response.inbounds?.forEach((inbound) => {
            nodeInBoundsMetrics.set(inbound.inbound, {
                downlink: inbound.downlink.toString(),
                uplink: inbound.uplink.toString(),
            });
        });

        await this.sendNodeMetrics({
            nodeUuid,
            nodeOutBoundsMetrics,
            nodeInBoundsMetrics,
        });

        return;
    }

    private async reportUsageHistory(
        dto: UpsertHistoryEntryCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<UpsertHistoryEntryCommand, ICommandResponse<void>>(
            new UpsertHistoryEntryCommand(dto.nodeUsageHistory),
        );
    }

    private async incrementUsedTraffic(
        dto: IncrementUsedTrafficCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<IncrementUsedTrafficCommand, ICommandResponse<void>>(
            new IncrementUsedTrafficCommand(dto.nodeUuid, dto.bytes),
        );
    }

    private async sendNodeMetrics(dto: {
        nodeUuid: string;
        nodeOutBoundsMetrics: Map<string, { downlink: string; uplink: string }>;
        nodeInBoundsMetrics: Map<string, { downlink: string; uplink: string }>;
    }): Promise<void> {
        await this.messageBus.dispatch(
            new RoutingMessage(
                new NodeMetricsMessage({
                    nodeUuid: dto.nodeUuid,
                    inbounds: Array.from(dto.nodeInBoundsMetrics.entries()).map(
                        ([tag, metrics]) => ({
                            tag,
                            downlink: metrics.downlink,
                            uplink: metrics.uplink,
                        }),
                    ),
                    outbounds: Array.from(dto.nodeOutBoundsMetrics.entries()).map(
                        ([tag, metrics]) => ({
                            tag,
                            downlink: metrics.downlink,
                            uplink: metrics.uplink,
                        }),
                    ),
                }),
                MessagingMessages.NODE_METRICS,
            ),
        );
    }
}
