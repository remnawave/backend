import { Job } from 'bullmq';
import dayjs from 'dayjs';
import pMap from 'p-map';

import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { TriggerThresholdNotificationCommand } from '@modules/users/commands/trigger-threshold-notification';
import { UpdateExceededTrafficUsersCommand } from '@modules/users/commands/update-exceeded-users';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { GetNotConnectedUsersQuery } from '@modules/users/queries/get-not-connected-users';
import { UpdateExpiredUsersCommand } from '@modules/users/commands/update-expired-users';
import { RemoveUserFromNodeEvent } from '@modules/nodes/events/remove-user-from-node';

import { StartAllNodesQueueService } from '@queue/start-all-nodes';

import { UserJobsJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.userJobs)
export class UserJobsQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UserJobsQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly eventBus: EventBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly startAllNodesQueueService: StartAllNodesQueueService,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case UserJobsJobNames.findExpiredUsers:
                return this.handleFindExpiredUsers(job);
            case UserJobsJobNames.findExceededUsers:
                return this.handleFindExceededUsers(job);
            case UserJobsJobNames.findUsersForThresholdNotification:
                return this.handleFindUsersForThresholdNotification(job);
            case UserJobsJobNames.findNotConnectedUsersNotification:
                return this.handleFindNotConnectedUsersNotification(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleFindExpiredUsers(job: Job) {
        try {
            const usersResponse = await this.updateExpiredUsers();
            if (!usersResponse.isOk || !usersResponse.response) {
                this.logger.error('No expired users found');
                return;
            }

            const updatedUsers = usersResponse.response;

            if (updatedUsers.length === 0) {
                this.logger.debug('No expired users found');
                return;
            }

            if (usersResponse.response.length >= 10_000) {
                this.logger.log(
                    'More than 10,000 expired users found, skipping webhook/telegram events.',
                );

                await this.startAllNodesQueueService.startAllNodes({
                    emitter: job.name,
                });

                return;
            }

            this.logger.log(
                `Job ${job.name} Found ${usersResponse.response.length} expired users.`,
            );

            await pMap(usersResponse.response, async (userIterator) => {
                try {
                    const userResponse = await this.queryBus.execute(
                        new GetUserByUniqueFieldQuery(
                            {
                                tId: userIterator.tId,
                            },
                            {
                                activeInternalSquads: true,
                            },
                        ),
                    );
                    if (!userResponse.isOk || !userResponse.response) {
                        return;
                    }

                    const user = userResponse.response;

                    this.eventEmitter.emit(
                        EVENTS.USER.EXPIRED,
                        new UserEvent({
                            user,
                            event: EVENTS.USER.EXPIRED,
                        }),
                    );

                    // TODO: find a better way to do this. If previous user status was limited, this event will throw warning.
                    await this.eventBus.publish(
                        new RemoveUserFromNodeEvent(user.username, user.vlessUuid),
                    );
                } catch (error) {
                    this.logger.error(
                        `Error handling "${UserJobsJobNames.findExpiredUsers}" job: ${error}`,
                    );
                }
            });
        } catch (error) {
            this.logger.error(
                `Error handling "${UserJobsJobNames.findExpiredUsers}" job: ${error}`,
            );
        }
    }

    private async handleFindExceededUsers(job: Job) {
        try {
            const usersResponse = await this.updateExceededTrafficUsers();
            if (!usersResponse.isOk || !usersResponse.response) {
                this.logger.error('No exceeded traffic usage users found');
                return;
            }

            const updatedUsers = usersResponse.response;

            if (updatedUsers.length === 0) {
                this.logger.debug('No exceeded traffic usage users found');
                return;
            }

            if (usersResponse.response.length >= 10_000) {
                this.logger.log(
                    'More than 10,000 exceeded traffic usage users found, skipping webhook/telegram events.',
                );

                await this.startAllNodesQueueService.startAllNodes({
                    emitter: job.name,
                });

                return;
            }

            this.logger.log(
                `Job ${job.name} has found ${usersResponse.response.length} exceeded traffic usage users.`,
            );

            await pMap(usersResponse.response, async (userIterator) => {
                try {
                    const userResponse = await this.queryBus.execute(
                        new GetUserByUniqueFieldQuery({
                            tId: userIterator.tId,
                        }),
                    );

                    if (!userResponse.isOk || !userResponse.response) {
                        this.logger.debug('User not found');
                        return;
                    }

                    const user = userResponse.response;

                    this.eventEmitter.emit(
                        EVENTS.USER.LIMITED,
                        new UserEvent({
                            user,
                            event: EVENTS.USER.LIMITED,
                        }),
                    );

                    await this.eventBus.publish(
                        new RemoveUserFromNodeEvent(user.username, user.vlessUuid),
                    );
                } catch (error) {
                    this.logger.error(
                        `Error handling "${UserJobsJobNames.findExceededUsers}" job: ${error}`,
                    );
                }
            });
        } catch (error) {
            this.logger.error(
                `Error handling "${UserJobsJobNames.findExceededUsers}" job: ${error}`,
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
                const usersResponse = await this.triggerThresholdNotifications(percentages);

                if (!usersResponse.isOk || !usersResponse.response) {
                    this.logger.debug('No users found for threshold notification');
                    break;
                }

                if (usersResponse.response.length === 0) {
                    this.logger.debug('No users found for threshold notification');
                    break;
                }

                this.logger.log(
                    `Job ${job.name} has found ${usersResponse.response.length} users for threshold notification.`,
                );

                let skipTelegramNotification = false;

                if (usersResponse.response.length >= 500) {
                    this.logger.warn(
                        'More than 500 users found for sending threshold notification, skipping Telegram events.',
                    );

                    // this.eventEmitter.emit(
                    //     EVENTS.ERRORS.BANDWIDTH_USAGE_THRESHOLD_REACHED_MAX_NOTIFICATIONS,
                    //     new CustomErrorEvent(
                    //         EVENTS.ERRORS.BANDWIDTH_USAGE_THRESHOLD_REACHED_MAX_NOTIFICATIONS,
                    //         {
                    //             description: `More than 500 users found for sending threshold notifications, skipping Telegram events.`,
                    //         },
                    //     ),
                    // );

                    skipTelegramNotification = true;
                }

                await pMap(
                    usersResponse.response,
                    async (userIterator) => {
                        try {
                            const userResponse = await this.queryBus.execute(
                                new GetUserByUniqueFieldQuery({
                                    tId: userIterator.tId,
                                }),
                            );

                            if (!userResponse.isOk || !userResponse.response) {
                                this.logger.debug('User not found');
                                return;
                            }

                            const user = userResponse.response;

                            this.eventEmitter.emit(
                                EVENTS.USER.BANDWIDTH_USAGE_THRESHOLD_REACHED,
                                new UserEvent({
                                    user,
                                    event: EVENTS.USER.BANDWIDTH_USAGE_THRESHOLD_REACHED,
                                    skipTelegramNotification,
                                }),
                            );
                        } catch (error) {
                            this.logger.error(
                                `Error handling "${UserJobsJobNames.findUsersForThresholdNotification}" job: ${error}`,
                            );
                        }
                    },
                    { concurrency: 80 },
                );

                continue;
            } catch (error) {
                this.logger.error(
                    `Error handling "${UserJobsJobNames.findUsersForThresholdNotification}" job: ${error}`,
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

                const usersResponse = await this.queryBus.execute(
                    new GetNotConnectedUsersQuery(start, end),
                );

                if (!usersResponse.isOk || !usersResponse.response) {
                    continue;
                }

                if (usersResponse.response.length === 0) {
                    continue;
                }

                this.logger.log(
                    `Job ${job.name} has found ${usersResponse.response.length} users for not connected interval ${interval} users notification.`,
                );

                let skipTelegramNotification = false;

                if (usersResponse.response.length >= 500) {
                    this.logger.warn(
                        'More than 500 users found for sending not connected users notification, skipping Telegram events.',
                    );

                    skipTelegramNotification = true;
                }

                await pMap(
                    usersResponse.response,
                    async (userEntity) => {
                        try {
                            this.eventEmitter.emit(
                                EVENTS.USER.NOT_CONNECTED,
                                new UserEvent({
                                    user: userEntity,
                                    event: EVENTS.USER.NOT_CONNECTED,
                                    meta: {
                                        notConnectedAfterHours: interval,
                                    },
                                    skipTelegramNotification,
                                }),
                            );
                        } catch (error) {
                            this.logger.error(
                                `Error handling "${UserJobsJobNames.findNotConnectedUsersNotification}" job: ${error}`,
                            );
                        }
                    },
                    { concurrency: 100 },
                );
            }
        } catch (error) {
            this.logger.error(
                `Error handling "${UserJobsJobNames.findNotConnectedUsersNotification}" job: ${error}`,
            );
        }
    }

    private async updateExpiredUsers(): Promise<ICommandResponse<{ tId: bigint }[]>> {
        return this.commandBus.execute<
            UpdateExpiredUsersCommand,
            ICommandResponse<{ tId: bigint }[]>
        >(new UpdateExpiredUsersCommand());
    }

    private async updateExceededTrafficUsers(): Promise<ICommandResponse<{ tId: bigint }[]>> {
        return this.commandBus.execute<
            UpdateExceededTrafficUsersCommand,
            ICommandResponse<{ tId: bigint }[]>
        >(new UpdateExceededTrafficUsersCommand());
    }

    private async triggerThresholdNotifications(
        percentages: number[],
    ): Promise<ICommandResponse<{ tId: bigint }[]>> {
        return this.commandBus.execute<
            TriggerThresholdNotificationCommand,
            ICommandResponse<{ tId: bigint }[]>
        >(new TriggerThresholdNotificationCommand(percentages));
    }
}
