import { Job } from 'bullmq';
import dayjs from 'dayjs';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { wrapBigInt, wrapBigIntNullable } from '@common/utils';
import { EVENTS, TUsersStatus, USERS_STATUS } from '@libs/contracts/constants';

import { GetUsersByExpireAtQuery } from '@modules/users/queries/get-users-by-expire-at/get-users-by-expire-at.query';
import { BulkAllExtendExpirationDateCommand } from '@modules/users/commands/bulk-all-extend-expiration-date';
import { BulkAllUpdateUsersRequestDto } from '@modules/users/dtos/bulk/bulk-operations.dto';
import { BulkDeleteByStatusCommand } from '@modules/users/commands/bulk-delete-by-status';
import { BulkUpdateAllUsersCommand } from '@modules/users/commands/bulk-update-all-users';
import { BulkSyncUsersCommand } from '@modules/users/commands/bulk-sync-users';

import { NodesQueuesService } from '@queue/_nodes/nodes-queues.service';
import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants/users-job-name.constant';
import { UsersQueuesService } from '../users-queues.service';

@Processor(QUEUES_NAMES.USERS.SERIAL_OPERATIONS, {
    concurrency: 1,
})
export class SerialUsersOperationsQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(SerialUsersOperationsQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly commandBus: CommandBus,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case USERS_JOB_NAMES.EXPIRE_USER_NOTIFICATIONS:
                return this.handleExpireUserNotifications();
            case USERS_JOB_NAMES.DELETE_BY_STATUS:
                return this.handleBulkDeleteByStatusJob(job);
            case USERS_JOB_NAMES.BULK_UPDATE_ALL_USERS:
                return this.handleBulkUpdateAllUsersJob(job);
            case USERS_JOB_NAMES.BULK_ALL_EXTEND_EXPIRATION_DATE:
                return this.handleBulkAllExtendExpirationDateJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleExpireUserNotifications() {
        try {
            const now = dayjs().utc();

            const DATES = {
                EXPIRES_IN_72_HOURS: {
                    START: now.add(72, 'hour').startOf('minute').toDate(),
                    END: now.add(72, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_72_HOURS,
                },
                EXPIRES_IN_48_HOURS: {
                    START: now.add(48, 'hour').startOf('minute').toDate(),
                    END: now.add(48, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_48_HOURS,
                },
                EXPIRES_IN_24_HOURS: {
                    START: now.add(24, 'hour').startOf('minute').toDate(),
                    END: now.add(24, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_24_HOURS,
                },
                EXPIRED_24_HOURS_AGO: {
                    START: now.subtract(24, 'hour').startOf('minute').toDate(),
                    END: now.subtract(24, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY_EXPIRED_24_HOURS_AGO,
                },
            } as const;

            await pMap(
                Object.values(DATES),
                async (date) => {
                    try {
                        const { isOk, response: users } = await this.queryBus.execute(
                            new GetUsersByExpireAtQuery(date.START, date.END),
                        );

                        if (!isOk || !users) {
                            return;
                        }

                        if (users.length === 0) {
                            return;
                        }

                        await this.usersQueuesService.fireUserEventBulk({
                            users,
                            userEvent: date.NAME,
                        });
                    } catch (error) {
                        this.logger.error(error);
                    }
                },

                { concurrency: 4 },
            );
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.EXPIRE_USER_NOTIFICATIONS}" job: ${error}`,
            );
        }
    }

    private async handleBulkDeleteByStatusJob(job: Job<{ status: TUsersStatus }>) {
        try {
            const { status } = job.data;

            let deletedCount = 0;
            let hasMoreData = true;

            while (hasMoreData) {
                const result = await this.bulkDeleteByStatus(status, 30_000);

                if (!result.response || !result.isOk) {
                    this.logger.error(
                        `Error handling "${USERS_JOB_NAMES.DELETE_BY_STATUS}" job: ${result.message}`,
                    );
                    break;
                }

                this.logger.debug(
                    `Deleted ${result.response.deletedCount} users with status "${status}"`,
                );

                deletedCount += result.response.deletedCount;
                hasMoreData = result.response.deletedCount > 0;
            }

            this.logger.log(
                `Deleted ${deletedCount} users with status "${status}", starting all nodes.`,
            );

            if (status === USERS_STATUS.ACTIVE) {
                await this.nodesQueuesService.startAllNodesWithoutDeduplication({
                    emitter: 'bulkDeleteByStatus',
                });
            }

            return {
                isOk: true,
                response: {
                    deletedCount,
                },
            };
        } catch (error) {
            this.logger.error(`Error handling "${USERS_JOB_NAMES.DELETE_BY_STATUS}" job: ${error}`);

            return {
                isOk: false,
            };
        }
    }

    private async bulkDeleteByStatus(
        status: TUsersStatus,
        limit?: number,
    ): Promise<
        ICommandResponse<{
            deletedCount: number;
        }>
    > {
        return this.commandBus.execute<
            BulkDeleteByStatusCommand,
            ICommandResponse<{
                deletedCount: number;
            }>
        >(new BulkDeleteByStatusCommand(status, limit));
    }

    private async handleBulkUpdateAllUsersJob(job: Job<{ dto: BulkAllUpdateUsersRequestDto }>) {
        try {
            const { dto } = job.data;

            await this.commandBus.execute(
                new BulkUpdateAllUsersCommand({
                    ...dto,
                    lastTriggeredThreshold: dto.trafficLimitBytes !== undefined ? 0 : undefined,
                    trafficLimitBytes: wrapBigInt(dto.trafficLimitBytes),
                    telegramId: wrapBigIntNullable(dto.telegramId),
                    hwidDeviceLimit: dto.hwidDeviceLimit,
                }),
            );

            if (dto.trafficLimitBytes !== undefined) {
                await this.commandBus.execute(new BulkSyncUsersCommand('limited'));
            }

            if (dto.expireAt !== undefined) {
                await this.commandBus.execute(new BulkSyncUsersCommand('expired'));
            }

            await this.nodesQueuesService.startAllNodesWithoutDeduplication({
                emitter: 'bulkUpdateAllUsers',
            });

            return {
                isOk: true,
            };
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.BULK_UPDATE_ALL_USERS}" job: ${error}`,
            );
        }
    }

    private async handleBulkAllExtendExpirationDateJob(job: Job<{ extendDays: number }>) {
        try {
            const { extendDays } = job.data;

            await this.commandBus.execute(new BulkAllExtendExpirationDateCommand(extendDays));

            await this.commandBus.execute(new BulkSyncUsersCommand('expired'));

            await this.nodesQueuesService.startAllNodesWithoutDeduplication({
                emitter: 'bulkAllExtendExpirationDate',
            });

            return {
                isOk: true,
            };
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.BULK_ALL_EXTEND_EXPIRATION_DATE}" job: ${error}`,
            );
        }
    }
}
