import { Job } from 'bullmq';

import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';

import { RawCacheService } from '@common/raw-cache';
import { INTERNAL_CACHE_KEYS } from '@libs/contracts/constants';

import { BulkUpsertUserHistoryEntryCommand } from '@modules/nodes-user-usage-history/commands/bulk-upsert-user-history-entry';
import { NodesUserUsageHistoryEntity } from '@modules/nodes-user-usage-history/entities';

import { IRecordUserUsageFromRedisPayload } from './interfaces';
import { PushFromRedisJobNames } from './enums';
import { QUEUES_NAMES } from '../queue.enum';

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

    constructor(
        private readonly commandBus: CommandBus,
        private readonly rawCacheService: RawCacheService,
        private readonly configService: ConfigService,
    ) {
        super();

        this.disableUserUsageRecords = this.configService.getOrThrow<boolean>(
            'SERVICE_DISABLE_USER_USAGE_RECORDS',
        );
    }

    onApplicationBootstrap() {
        if (this.disableUserUsageRecords) {
            this.logger.warn(
                'SERVICE_DISABLE_USER_USAGE_RECORDS is enabled, user usage records will not be recorded.',
            );
        } else {
            this.logger.log('User usage records will be recorded to the database.');
        }
    }

    async process(job: Job) {
        switch (job.name) {
            case PushFromRedisJobNames.recordUserUsage:
                return await this.handleRecordUserUsageJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleRecordUserUsageJob(job: Job<IRecordUserUsageFromRedisPayload>) {
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

            const nodeId = BigInt(redisKey.split(':')[1]);

            for await (const batch of this.scanAndBatch(processingKey, nodeId)) {
                await this.commandBus.execute(new BulkUpsertUserHistoryEntryCommand(batch));
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
}
