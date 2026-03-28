import ems from 'enhanced-ms';
import { Job } from 'bullmq';
import { t } from 'try';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { GetUsersStatsCommand } from '@remnawave/node-contract';

import { fromNanoToNumber } from '@common/utils/nano';
import { RawCacheService } from '@common/raw-cache';
import { AxiosService } from '@common/axios';
import {
    CACHE_KEYS,
    CACHE_KEYS_TTL,
    INTERNAL_CACHE_KEYS,
    INTERNAL_CACHE_KEYS_TTL,
} from '@libs/contracts/constants';

import { PushFromRedisQueueService } from '@queue/push-from-redis/push-from-redis.service';
import { UsersQueuesService } from '@queue/_users';
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
        private readonly configService: ConfigService,
        private readonly usersQueuesService: UsersQueuesService,
        private readonly pushFromRedisQueueService: PushFromRedisQueueService,
        private readonly rawCacheService: RawCacheService,
    ) {
        super();

        this.ignoreBelowBytes = this.configService.getOrThrow<bigint>(
            'USER_USAGE_IGNORE_BELOW_BYTES',
        );
    }

    async process(job: Job<IRecordUserUsagePayload>) {
        try {
            const { nodeUuid, nodeAddress, nodePort, consumptionMultiplier, nodeId } = job.data;

            const response = await this.axios.getUsersStats(
                {
                    reset: true,
                },
                nodeAddress,
                nodePort,
            );

            switch (response.isOk) {
                case true:
                    return await this.handleOk(
                        nodeUuid,
                        BigInt(nodeId),
                        response.response!,
                        consumptionMultiplier,
                    );
                case false:
                    await this.rawCacheService.set(
                        CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                        0,
                        CACHE_KEYS_TTL.NODE_USERS_ONLINE,
                    );

                    this.logger.error(
                        `Failed to get users stats, node: ${nodeUuid} – ${nodeAddress}:${nodePort}, error: ${JSON.stringify(
                            response,
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
        response: GetUsersStatsCommand.Response,
        consumptionMultiplier: string,
    ) {
        const start = performance.now();

        try {
            if (response.response.users.length === 0) {
                await this.rawCacheService.set(
                    CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                    0,
                    CACHE_KEYS_TTL.NODE_USERS_ONLINE,
                );

                return;
            }

            const userUsageList: { u: string; b: string; n: string }[] = new Array(
                response.response.users.length,
            );
            let userUsageIndex = 0;

            const nodeRedisKey = INTERNAL_CACHE_KEYS.NODE_USER_USAGE(nodeId);

            const pipeline = this.rawCacheService.createPipeline();

            response.response.users.forEach((user) => {
                const { ok } = t(() => BigInt(user.username));

                if (!ok) {
                    return;
                }

                const totalBytes = user.downlink + user.uplink;

                if (totalBytes < this.ignoreBelowBytes) {
                    return;
                }

                pipeline.hincrby(nodeRedisKey, user.username, totalBytes);

                userUsageList[userUsageIndex++] = {
                    u: user.username,
                    b: this.multiplyConsumption(consumptionMultiplier, totalBytes).toString(),
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

    private multiplyConsumption(consumptionMultiplier: string, totalBytes: number): bigint {
        const multiplier = BigInt(consumptionMultiplier);
        if (multiplier === 0n) {
            return 0n;
        }

        if (multiplier === BigInt(1000000000)) {
            // skip if 1:1 ratio
            return BigInt(totalBytes);
        }

        return BigInt(Math.floor(fromNanoToNumber(multiplier) * totalBytes));
    }
}
