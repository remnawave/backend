import { InjectRedis } from '@songkeys/nestjs-redis';
import { Job } from 'bullmq';
import Redis from 'ioredis';

import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { INTERNAL_CACHE_KEYS } from '@libs/contracts/constants';

import { BulkUpsertUserHistoryEntryCommand } from '@modules/nodes-user-usage-history/commands/bulk-upsert-user-history-entry/bulk-upsert-user-history-entry.command';
import { NodesUserUsageHistoryEntity } from '@modules/nodes-user-usage-history';

import { IRecordUserUsageFromRedisPayload } from './interfaces';
import { PushFromRedisJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.pushFromRedis, {
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
        @InjectRedis() private readonly redis: Redis,
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
                return this.handleRecordUserUsageJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async reportBulkUserUsageHistory(
        dto: BulkUpsertUserHistoryEntryCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<BulkUpsertUserHistoryEntryCommand, ICommandResponse<void>>(
            new BulkUpsertUserHistoryEntryCommand(dto.userUsageHistoryList),
        );
    }

    private async handleRecordUserUsageJob(job: Job<IRecordUserUsageFromRedisPayload>) {
        const { redisKey } = job.data;
        const processingKey = `${redisKey}${INTERNAL_CACHE_KEYS.PROCESSING_POSTFIX}`;

        try {
            if (this.disableUserUsageRecords) {
                return {
                    isOk: true,
                };
            }

            const exists = await this.redis.exists(redisKey);

            if (exists === 0) {
                return {
                    isOk: false,
                    error: 'Redis key not found',
                };
            }

            await this.redis.rename(redisKey, processingKey);

            const results = await this.redis.hgetall(processingKey);

            for await (const batch of this.batchEntries(results, redisKey)) {
                await this.reportBulkUserUsageHistory({
                    userUsageHistoryList: batch,
                });
            }

            return {
                isOk: true,
            };
        } catch (error) {
            this.logger.error(
                `Error handling "${PushFromRedisJobNames.recordUserUsage}" job: ${error}`,
            );
            return {
                isOk: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        } finally {
            await this.redis.del(processingKey);
        }
    }

    private async *batchEntries(
        data: Record<string, string>,
        keyString: string,
        batchSize: number = 10_000,
    ): AsyncGenerator<NodesUserUsageHistoryEntity[]> {
        const entries = Object.entries(data);
        let batch: NodesUserUsageHistoryEntity[] = [];

        for (const [userId, totalBytes] of entries) {
            batch.push(
                new NodesUserUsageHistoryEntity({
                    nodeId: BigInt(keyString.split(':')[1]),
                    userId: BigInt(userId),
                    totalBytes: BigInt(totalBytes),
                }),
            );

            if (batch.length >= batchSize) {
                yield batch;
                batch = [];
            }
        }

        if (batch.length > 0) {
            yield batch;
        }
    }
}
