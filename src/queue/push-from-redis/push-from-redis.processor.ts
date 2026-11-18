import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache';
import { EXPORT_TO_STREAM_KEYS, INTERNAL_CACHE_KEYS } from '@libs/contracts/constants';
import { USER_USAGE_STREAM_MESSAGE_VERSION } from '@libs/contracts/models';

import { BulkUpsertInboundUsageHistoryCommand } from '@modules/config-profiles/commands/bulk-upsert-inbound-usage-history';
import { BulkUpsertUserHistoryEntryCommand } from '@modules/nodes-user-usage-history/commands/bulk-upsert-user-history-entry';
import { NodesUserUsageHistoryEntity } from '@modules/nodes-user-usage-history/entities';

import { QUEUES_NAMES } from '../queue.enum';
import { PushFromRedisJobNames } from './enums';
import { IRecordUserUsageFromRedisPayload } from './interfaces';

@Processor(QUEUES_NAMES.PUSH_TO_DB, {
    concurrency: 10,
    limiter: {
        max: 3,
        duration: 500,
    },
})
export class PushFromRedisQueueProcessor extends WorkerHost implements OnApplicationBootstrap {
    private readonly logger = new Logger(PushFromRedisQueueProcessor.name);
    private readonly disableUserUsageRecords: boolean;
    private readonly exportToStreamEnabled: boolean;
    private readonly exportToStreamMaxLen: number;

    constructor(
        private readonly commandBus: CommandBus,
        private readonly rawCacheService: RawCacheService,
        private readonly configService: TypedConfigService,
    ) {
        super();

        this.disableUserUsageRecords = this.configService.getOrThrow(
            'SERVICE_DISABLE_USER_USAGE_RECORDS',
        );
        this.exportToStreamEnabled = this.configService.getOrThrow('EXPORT_TO_STREAM_ENABLED');
        this.exportToStreamMaxLen = this.configService.getOrThrow('EXPORT_TO_STREAM_MAXLEN');
    }

    onApplicationBootstrap() {
        if (this.disableUserUsageRecords) {
            this.logger.warn(
                'SERVICE_DISABLE_USER_USAGE_RECORDS is enabled, user usage records will not be recorded.',
            );
        } else {
            this.logger.log('User usage records will be recorded to the database.');
        }

        if (this.exportToStreamEnabled) {
            this.logger.log(
                `[STREAM] key "${EXPORT_TO_STREAM_KEYS.PREFIX}${EXPORT_TO_STREAM_KEYS.USER_USAGE}", maxlen ~${this.exportToStreamMaxLen}.`,
            );
        }
    }

    async process(job: Job) {
        switch (job.name) {
            case PushFromRedisJobNames.recordUserUsage:
                return await this.handleRecordUserUsageJob(job);
            case PushFromRedisJobNames.recordUserInboundUsage:
                return await this.handleRecordUserInboundUsageJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleRecordUserUsageJob(job: Job<IRecordUserUsageFromRedisPayload>) {
        const { redisKey } = job.data;
        const processingKey = `${redisKey}${INTERNAL_CACHE_KEYS.PROCESSING_POSTFIX}`;

        try {
            if (this.disableUserUsageRecords && !this.exportToStreamEnabled) {
                return;
            }

            const exists = await this.rawCacheService.exists(redisKey);

            if (!exists) {
                return;
            }

            await this.rawCacheService.rename(redisKey, processingKey);

            const nodeId = BigInt(redisKey.split(':')[1]);

            for await (const batch of this.scanAndBatch(processingKey, nodeId)) {
                if (!this.disableUserUsageRecords) {
                    await this.commandBus.execute(new BulkUpsertUserHistoryEntryCommand(batch));
                }
                if (this.exportToStreamEnabled) {
                    await this.exportBatchToStream(nodeId, batch);
                }
            }

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${PushFromRedisJobNames.recordUserUsage}" job: ${error}`,
            );
            return;
        } finally {
            await this.rawCacheService.del(processingKey);
        }
    }

    private async handleRecordUserInboundUsageJob(job: Job<IRecordUserUsageFromRedisPayload>) {
        const { redisKey } = job.data;
        const processingKey = `${redisKey}${INTERNAL_CACHE_KEYS.PROCESSING_POSTFIX}`;

        try {
            if (this.disableUserUsageRecords) {
                return;
            }

            const exists = await this.rawCacheService.exists(redisKey);

            if (!exists) {
                return;
            }

            await this.rawCacheService.rename(redisKey, processingKey);

            for await (const batch of this.scanAndBatchInbound(processingKey)) {
                if (batch.length > 0) {
                    await this.commandBus.execute(new BulkUpsertInboundUsageHistoryCommand(batch));
                }
            }

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${PushFromRedisJobNames.recordUserInboundUsage}" job: ${error}`,
            );
            return;
        } finally {
            await this.rawCacheService.del(processingKey);
        }
    }

    private async exportBatchToStream(
        nodeId: bigint,
        batch: NodesUserUsageHistoryEntity[],
    ): Promise<void> {
        try {
            const parts: string[] = [];
            for (const entry of batch) {
                parts.push(`${entry.userId}:${entry.totalBytes}`);
            }

            await this.rawCacheService.xaddTrimmed(
                EXPORT_TO_STREAM_KEYS.USER_USAGE,
                this.exportToStreamMaxLen,
                {
                    v: USER_USAGE_STREAM_MESSAGE_VERSION,
                    nodeId: nodeId.toString(),
                    ts: new Date().toISOString(),
                    records: parts.join(';'),
                },
            );
        } catch (error) {
            this.logger.error(`Error exporting usage batch to stream: ${error}`);
        }
    }

    private async *scanAndBatch(
        key: string,
        nodeId: bigint,
        batchSize: number = 10_000,
    ): AsyncGenerator<NodesUserUsageHistoryEntity[]> {
        const stream = this.rawCacheService.hscanStream(key, { count: batchSize });

        for await (const chunk of stream) {
            const batch: NodesUserUsageHistoryEntity[] = [];

            for (let i = 0; i < chunk.length; i += 2) {
                batch.push(
                    new NodesUserUsageHistoryEntity({
                        nodeId,
                        userId: BigInt(chunk[i]),
                        totalBytes: BigInt(chunk[i + 1]),
                    }),
                );
            }

            if (batch.length > 0) {
                yield batch;
            }
        }
    }

    private async *scanAndBatchInbound(
        key: string,
        batchSize: number = 10_000,
    ): AsyncGenerator<{ userId: string; inboundUuid: string; totalBytes: string }[]> {
        const stream = this.rawCacheService.hscanStream(key, { count: batchSize });

        for await (const chunk of stream) {
            const batch: { userId: string; inboundUuid: string; totalBytes: string }[] = [];

            for (let i = 0; i < chunk.length; i += 2) {
                const [userId, inboundUuid] = chunk[i].split(':');
                if (!userId || !inboundUuid) continue;

                batch.push({ userId, inboundUuid, totalBytes: chunk[i + 1] });
            }

            if (batch.length > 0) {
                yield batch;
            }
        }
    }
}
