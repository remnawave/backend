import { Job } from 'bullmq';
import dayjs from 'dayjs';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { TriggerThresholdNotificationCommand } from '@modules/users/commands/trigger-threshold-notification';
import { UpdateExceededTrafficUsersCommand } from '@modules/users/commands/update-exceeded-users';
import { GetNotConnectedUsersQuery } from '@modules/users/queries/get-not-connected-users';
import { UpdateExpiredUsersCommand } from '@modules/users/commands/update-expired-users';

import { NodesQueuesService } from '@queue/_nodes';
import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants/users-job-name.constant';
import { UsersQueuesService } from '../users-queues.service';

@Processor(QUEUES_NAMES.USERS.USERS_WATCHDOG, {
    concurrency: 1,
})
export class UsersWatchdogQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UsersWatchdogQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly configService: ConfigService,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case USERS_JOB_NAMES.FIND_EXPIRED_USERS:
                return await this.handleFindExpiredUsers(job);
            case USERS_JOB_NAMES.FIND_EXCEEDED_TRAFFIC_USAGE_USERS:
                return await this.handleFindExceededUsers(job);
            case USERS_JOB_NAMES.FIND_USERS_FOR_THRESHOLD_NOTIFICATION:
                return await this.handleFindUsersForThresholdNotification(job);
            case USERS_JOB_NAMES.FIND_NOT_CONNECTED_USERS_NOTIFICATION:
                return await this.handleFindNotConnectedUsersNotification(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleFindExpiredUsers(job: Job) {
        try {
            const usersResponse = await this.updateExpiredUsers();
            if (!usersResponse.isOk) {
                this.logger.error('No expired users found');
                return;
            }

            const { response: updatedUsers } = usersResponse;

            if (updatedUsers.length === 0) {
                this.logger.debug('No expired users found');
                return;
            }

            if (updatedUsers.length >= 10_000) {
                this.logger.log(
                    'More than 10,000 expired users found, skipping webhook/telegram events.',
                );

                await this.nodesQueuesService.startAllNodes({
                    emitter: job.name,
                });

                return;
            }

            this.logger.log(`Job ${job.name} has found ${updatedUsers.length} expired users.`);

            await this.usersQueuesService.fireUserEventBulk({
                users: updatedUsers,
                userEvent: EVENTS.USER.EXPIRED,
            });
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.FIND_EXPIRED_USERS}" job: ${error}`,
            );
        }
    }

    private async handleFindExceededUsers(job: Job) {
        try {
            const updateExceededTrafficUsersResult = await this.updateExceededTrafficUsers();
            if (!updateExceededTrafficUsersResult.isOk) {
                this.logger.error('No exceeded traffic usage users found');
                return;
            }

            const { response: users } = updateExceededTrafficUsersResult;

            if (users.length === 0) {
                this.logger.debug('No exceeded traffic usage users found');
                return;
            }

            if (users.length >= 10_000) {
                this.logger.log(
                    'More than 10,000 exceeded traffic usage users found, skipping webhook/telegram events.',
                );

                await this.nodesQueuesService.startAllNodes({
                    emitter: job.name,
                });

                return;
            }

            this.logger.log(
                `Job ${job.name} has found ${users.length} exceeded traffic usage users.`,
            );

            await this.usersQueuesService.fireUserEventBulk({
                users,
                userEvent: EVENTS.USER.LIMITED,
            });

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.FIND_EXCEEDED_TRAFFIC_USAGE_USERS}" job: ${error}`,
            );
        }
    }

    private async handleFindUsersForThresholdNotification(job: Job) {
        const percentages = this.configService.getOrThrow<number[]>(
            'BANDWIDTH_USAGE_NOTIFICATIONS_THRESHOLD',
        );

        // Loop reason: SQL query is strictly limited by 5000 users
        while (true) {
            try {
                const triggerThresholdNotificationsResult =
                    await this.triggerThresholdNotifications(percentages);

                if (!triggerThresholdNotificationsResult.isOk) {
                    this.logger.debug('No users found for threshold notification');
                    break;
                }

                const { response: users } = triggerThresholdNotificationsResult;

                if (users.length === 0) {
                    this.logger.debug('No users found for threshold notification');
                    break;
                }

                this.logger.log(
                    `Job ${job.name} has found ${users.length} users for threshold notification.`,
                );

                let skipTelegramNotification = false;

                if (users.length >= 500) {
                    this.logger.warn(
                        'More than 500 users found for sending threshold notification, skipping Telegram events.',
                    );

                    skipTelegramNotification = true;
                } else {
                    skipTelegramNotification = false;
                }

                await this.usersQueuesService.fireUserEventBulk({
                    users,
                    userEvent: EVENTS.USER.BANDWIDTH_USAGE_THRESHOLD_REACHED,
                    skipTelegramNotification,
                });

                continue;
            } catch (error) {
                this.logger.error(
                    `Error handling "${USERS_JOB_NAMES.FIND_USERS_FOR_THRESHOLD_NOTIFICATION}" job: ${error}`,
                );

                continue;
            }
        }
    }

    private async handleFindNotConnectedUsersNotification(job: Job) {
        const intervals = this.configService.getOrThrow<number[]>(
            'NOT_CONNECTED_USERS_NOTIFICATIONS_AFTER_HOURS',
        );
        const now = dayjs().utc();

        try {
            for (const interval of intervals) {
                const targetTime = now.subtract(interval, 'hours');
                const start = targetTime.subtract(10, 'minutes').toDate();
                const end = targetTime.toDate();

                const getNotConnectedUsersResult = await this.queryBus.execute(
                    new GetNotConnectedUsersQuery(start, end),
                );

                if (!getNotConnectedUsersResult.isOk) {
                    continue;
                }

                if (getNotConnectedUsersResult.response.length === 0) {
                    continue;
                }

                const { response: users } = getNotConnectedUsersResult;

                this.logger.log(
                    `Job ${job.name} has found ${users.length} users for not connected interval ${interval} users notification.`,
                );

                let skipTelegramNotification = false;

                if (users.length >= 500) {
                    this.logger.warn(
                        'More than 500 users found for sending not connected users notification, skipping Telegram events.',
                    );

                    skipTelegramNotification = true;
                } else {
                    skipTelegramNotification = false;
                }

                await this.usersQueuesService.fireUserEventBulk({
                    users,
                    userEvent: EVENTS.USER.NOT_CONNECTED,
                    meta: {
                        notConnectedAfterHours: interval,
                    },
                    skipTelegramNotification,
                });
            }
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.FIND_NOT_CONNECTED_USERS_NOTIFICATION}" job: ${error}`,
            );
        }
    }

    private async updateExpiredUsers(): Promise<TResult<{ tId: bigint }[]>> {
        return this.commandBus.execute<UpdateExpiredUsersCommand, TResult<{ tId: bigint }[]>>(
            new UpdateExpiredUsersCommand(),
        );
    }

    private async updateExceededTrafficUsers(): Promise<TResult<{ tId: bigint }[]>> {
        return this.commandBus.execute<
            UpdateExceededTrafficUsersCommand,
            TResult<{ tId: bigint }[]>
        >(new UpdateExceededTrafficUsersCommand());
    }

    private async triggerThresholdNotifications(
        percentages: number[],
    ): Promise<TResult<{ tId: bigint }[]>> {
        return this.commandBus.execute<
            TriggerThresholdNotificationCommand,
            TResult<{ tId: bigint }[]>
        >(new TriggerThresholdNotificationCommand(percentages));
    }
}
