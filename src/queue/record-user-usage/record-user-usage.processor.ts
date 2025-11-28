import { InjectRedis } from '@songkeys/nestjs-redis';
import { Redis } from 'ioredis';
import ems from 'enhanced-ms';
import { Job } from 'bullmq';
import { t } from 'try';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { GetUsersStatsCommand } from '@remnawave/node-contract';

import { ICommandResponse } from '@common/types/command-response.type';
import { fromNanoToNumber } from '@common/utils/nano';
import { AxiosService } from '@common/axios';
import { INTERNAL_CACHE_KEYS, INTERNAL_CACHE_KEYS_TTL } from '@libs/contracts/constants';

import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';
import { NodesEntity } from '@modules/nodes';

import { UpdateUsersUsageQueueService } from '@queue/update-users-usage/update-users-usage.service';
import { PushFromRedisQueueService } from '@queue/push-from-redis/push-from-redis.service';

import { RecordUserUsagePayload } from './interfaces';
import { RecordUserUsageJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.recordUserUsage, {
    concurrency: 20,
})
export class RecordUserUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(RecordUserUsageQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly axios: AxiosService,
        private readonly updateUsersUsageQueueService: UpdateUsersUsageQueueService,
        private readonly pushFromRedisQueueService: PushFromRedisQueueService,
        @InjectRedis() private readonly redis: Redis,
    ) {
        super();
    }

    async process(job: Job<RecordUserUsagePayload>) {
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
                    await this.updateNode({
                        node: {
                            uuid: nodeUuid,
                            usersOnline: 0,
                        },
                    });

                    this.logger.error(
                        `Failed to get users stats, node: ${nodeUuid} – ${nodeAddress}:${nodePort}, error: ${JSON.stringify(
                            response,
                        )}`,
                    );

                    return;
            }
        } catch (error) {
            this.logger.error(
                `Error handling "${RecordUserUsageJobNames.recordUserUsage}" job: ${error}`,
            );
            return { isOk: false };
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
                await this.updateNode({
                    node: {
                        uuid: nodeUuid,
                        usersOnline: 0,
                    },
                });

                return;
            }

            const userUsageList: { u: string; b: string; n: string }[] = new Array(
                response.response.users.length,
            );
            let userUsageIndex = 0;

            const nodeRedisKey = INTERNAL_CACHE_KEYS.NODE_USER_USAGE(nodeId);

            const pipeline = this.redis.pipeline();

            response.response.users.forEach((user) => {
                const { ok } = t(() => BigInt(user.username));

                if (!ok) {
                    return;
                }

                const totalBytes = user.downlink + user.uplink;

                pipeline.hincrby(nodeRedisKey, user.username, totalBytes);

                userUsageList[userUsageIndex++] = {
                    u: user.username,
                    b: this.multiplyConsumption(consumptionMultiplier, totalBytes).toString(),
                    n: nodeUuid,
                };
            });

            if (userUsageIndex === 0) {
                await this.updateNode({
                    node: {
                        uuid: nodeUuid,
                        usersOnline: 0,
                    },
                });

                return;
            }

            pipeline.expire(nodeRedisKey, INTERNAL_CACHE_KEYS_TTL.NODE_USER_USAGE);

            await pipeline.exec();

            await this.updateNode({
                node: {
                    uuid: nodeUuid,
                    usersOnline: userUsageIndex,
                },
            });

            await this.updateUsersUsageQueueService.updateUserUsage(
                userUsageList.slice(0, userUsageIndex),
            );

            await this.pushFromRedisQueueService.recordUserUsageDelayed({
                redisKey: nodeRedisKey,
            });

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${RecordUserUsageJobNames.recordUserUsage}" job: ${error}`,
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

    private async updateNode(dto: UpdateNodeCommand): Promise<ICommandResponse<NodesEntity>> {
        return this.commandBus.execute<UpdateNodeCommand, ICommandResponse<NodesEntity>>(
            new UpdateNodeCommand(dto.node),
        );
    }

    private multiplyConsumption(consumptionMultiplier: string, totalBytes: number): bigint {
        const consumptionMultiplierNumber = BigInt(consumptionMultiplier);
        if (consumptionMultiplierNumber === BigInt(1000000000)) {
            // skip if 1:1 ratio
            return BigInt(totalBytes);
        }

        return BigInt(Math.floor(fromNanoToNumber(consumptionMultiplierNumber) * totalBytes));
    }
}
