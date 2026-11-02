import { Job } from 'bullmq';
import ems from 'enhanced-ms';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { GetUsersStatsCommand } from '@remnawave/node-contract';

import { AxiosService } from '@common/axios';
import { TypedConfigService } from '@common/config/app-config';
import { parseClientEmail } from '@common/helpers/xray-config/client-email';
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

            // Sum per-inbound rows by user before applying the traffic threshold.
            const perUserBytes = new Map<string, number>();
            const usageRows: Array<{
                userId: string;
                inboundUuid: string | null;
                totalBytes: number;
            }> = [];
            const onlineByInbound = new Map<string, Set<string>>();
            const nodeRedisKey = INTERNAL_CACHE_KEYS.NODE_USER_USAGE(nodeId);
            const nodeInboundRedisKey = INTERNAL_CACHE_KEYS.NODE_USER_INBOUND_USAGE(nodeId);

            const pipeline = this.rawCacheService.createPipeline();
            let hasInboundUsage = false;

            response.users.forEach((user) => {
                const { userId, inboundUuid } = parseClientEmail(user.username);

                try {
                    BigInt(userId);
                } catch {
                    return;
                }

                const totalBytes = user.downlink + user.uplink;

                perUserBytes.set(userId, (perUserBytes.get(userId) ?? 0) + totalBytes);
                usageRows.push({ userId, inboundUuid, totalBytes });
            });

            for (const [userId, totalBytes] of perUserBytes) {
                if (totalBytes < this.ignoreBelowBytes) {
                    perUserBytes.delete(userId);
                }
            }

            for (const { userId, inboundUuid, totalBytes } of usageRows) {
                if (!perUserBytes.has(userId)) {
                    continue;
                }

                if (inboundUuid) {
                    pipeline.hincrby(nodeInboundRedisKey, `${userId}:${inboundUuid}`, totalBytes);
                    hasInboundUsage = true;

                    let onlineSet = onlineByInbound.get(inboundUuid);
                    if (!onlineSet) {
                        onlineSet = new Set();
                        onlineByInbound.set(inboundUuid, onlineSet);
                    }
                    onlineSet.add(userId);
                }
            }

            for (const [userId, totalBytes] of perUserBytes) {
                pipeline.hincrby(nodeRedisKey, userId, totalBytes);
            }

            pipeline.expire(nodeRedisKey, INTERNAL_CACHE_KEYS_TTL.NODE_USER_USAGE);
            if (hasInboundUsage) {
                pipeline.expire(
                    nodeInboundRedisKey,
                    INTERNAL_CACHE_KEYS_TTL.NODE_USER_INBOUND_USAGE,
                );
            }

            await pipeline.exec();

            await this.rawCacheService.set(
                CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
                perUserBytes.size,
                CACHE_KEYS_TTL.NODE_USERS_ONLINE,
            );

            const userUsageList = Array.from(perUserBytes, ([userId, totalBytes]) => ({
                u: userId,
                b: multiplyConsumption(consumptionMultiplier, totalBytes).toString(),
                n: nodeUuid,
            }));

            await this.usersQueuesService.updateUserUsage(userUsageList);

            await this.pushFromRedisQueueService.recordUserUsageDelayed({
                redisKey: nodeRedisKey,
            });

            if (hasInboundUsage) {
                await this.pushFromRedisQueueService.recordUserInboundUsageDelayed({
                    redisKey: nodeInboundRedisKey,
                });

                await this.updateInboundOnlineCounts(nodeUuid, onlineByInbound);
            }

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

    private async updateInboundOnlineCounts(
        nodeUuid: string,
        onlineByInbound: Map<string, Set<string>>,
    ): Promise<void> {
        try {
            const pipeline = this.rawCacheService.createPipeline();

            for (const [inboundUuid, onlineSet] of onlineByInbound) {
                pipeline.set(
                    CACHE_KEYS.NODE_INBOUND_USERS_ONLINE(nodeUuid, inboundUuid),
                    onlineSet.size,
                    'EX',
                    CACHE_KEYS_TTL.NODE_INBOUND_USERS_ONLINE,
                );
            }

            await pipeline.exec();
        } catch (error) {
            this.logger.error(
                `Error updating inbound online counts for node ${nodeUuid}: ${error}`,
            );
        }
    }
}
