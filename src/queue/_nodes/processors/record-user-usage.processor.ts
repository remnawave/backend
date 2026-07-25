import { Job } from 'bullmq';
import ems from 'enhanced-ms';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { GetUsersStatsCommand } from '@remnawave/node-contract';

import { AxiosService } from '@common/axios';
import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache';
import { multiplyConsumption } from '@common/utils/nano';
import {
    CACHE_KEYS,
    CACHE_KEYS_TTL,
    INTERNAL_CACHE_KEYS,
    INTERNAL_CACHE_KEYS_TTL,
} from '@libs/contracts/constants';

import { UsersQueuesService } from '@queue/_users';
import { PushFromRedisQueueService } from '@queue/push-from-redis/push-from-redis.service';
import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';
import { IRecordUserUsagePayload } from '../interfaces';

@Processor(QUEUES_NAMES.NODES.RECORD_USER_USAGE, {
    concurrency: 20,
})
export class RecordUserUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(RecordUserUsageQueueProcessor.name);
    private readonly ignoreBelowBytes: bigint;

    constructor(
        private readonly commandBus: CommandBus,
        private readonly axios: AxiosService,
        private readonly configService: TypedConfigService,
        private readonly usersQueuesService: UsersQueuesService,
        private readonly pushFromRedisQueueService: PushFromRedisQueueService,
        private readonly rawCacheService: RawCacheService,
    ) {
        super();

        this.ignoreBelowBytes = this.configService.getOrThrow('USER_USAGE_IGNORE_BELOW_BYTES');
    }

    async process(job: Job<IRecordUserUsagePayload>) {
        try {
            const { nodeUuid, connectionOpts, consumptionMultiplier, nodeId } = job.data;

            const queryResult = await this.axios.getUsersStats(
                {
                    reset: true,
                },
                {
                    address: connectionOpts.address,
                    port: connectionOpts.port,
                    proxyUrl: connectionOpts.proxyUrl,
                },
            );

            switch (queryResult.isOk) {
                case true:
                    return await this.handleOk(
                        nodeUuid,
                        BigInt(nodeId),
                        queryResult.response,
                        consumptionMultiplier,
                    );
                case false:
                    await this.rawCacheService.set(
                        CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                        0,
                        CACHE_KEYS_TTL.NODE_USERS_ONLINE,
                    );

                    this.logger.error(
                        `Failed to get users stats, node: ${nodeUuid} – ${connectionOpts.address}:${connectionOpts.port}, error: ${JSON.stringify(
                            queryResult,
                        )}`,
                    );

                    return;
            }
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.RECORD_USER_USAGE}" job: ${error}`,
            );
            return;
        }
    }

    private async handleOk(
        nodeUuid: string,
        nodeId: bigint,
        response: GetUsersStatsCommand.Response['response'],
        consumptionMultiplier: string,
    ) {
        const start = performance.now();

        try {
            if (response.users.length === 0) {
                await this.rawCacheService.set(
                    CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                    0,
                    CACHE_KEYS_TTL.NODE_USERS_ONLINE,
                );

                return;
            }

            const userUsageList: { u: string; b: string; n: string }[] = Array.from({
                length: response.users.length,
            });

            let userUsageIndex = 0;

            const nodeRedisKey = INTERNAL_CACHE_KEYS.NODE_USER_USAGE(nodeId);

            const pipeline = this.rawCacheService.createPipeline();

            response.users.forEach((user) => {
                try {
                    BigInt(user.username);
                } catch {
                    return;
                }

                const totalBytes = user.downlink + user.uplink;

                if (totalBytes < this.ignoreBelowBytes) {
                    return;
                }

                pipeline.hincrby(nodeRedisKey, user.username, totalBytes);

                userUsageList[userUsageIndex++] = {
                    u: user.username,
                    b: multiplyConsumption(consumptionMultiplier, totalBytes).toString(),
                    n: nodeUuid,
                };
            });

            pipeline.expire(nodeRedisKey, INTERNAL_CACHE_KEYS_TTL.NODE_USER_USAGE);

            await pipeline.exec();

            await this.rawCacheService.set(
                CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                userUsageIndex,
                CACHE_KEYS_TTL.NODE_USERS_ONLINE,
            );

            await this.usersQueuesService.updateUserUsage(userUsageList.slice(0, userUsageIndex));

            await this.pushFromRedisQueueService.recordUserUsageDelayed({
                redisKey: nodeRedisKey,
            });

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.RECORD_USER_USAGE}" job: ${error}`,
            );
            return { isOk: false };
        } finally {
            const elapsedTime = performance.now() - start;
            if (elapsedTime > 2_000) {
                this.logger.warn(
                    `[${nodeUuid}] took ${ems(elapsedTime, {
                        extends: 'short',
                        includeMs: true,
                    })}`,
                );
            }
        }
    }
}
