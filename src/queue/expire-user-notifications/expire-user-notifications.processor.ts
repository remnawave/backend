import { Job } from 'bullmq';
import dayjs from 'dayjs';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { EVENTS, TUserEvents } from '@libs/contracts/constants';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { GetUsersByExpireAtQuery } from '@modules/users/queries/get-users-by-expire-at/get-users-by-expire-at.query';
import { UserEntity } from '@modules/users/entities/user.entity';

import { ExpireUserNotificationsJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.expireUserNotifications)
export class ExpireUserNotificationsQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ExpireUserNotificationsQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case ExpireUserNotificationsJobNames.expireUserNotifications:
                return this.handleExpireUserNotifications();
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
                    NAME: EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_72_HOURS,
                },
                EXPIRES_IN_48_HOURS: {
                    START: now.add(48, 'hour').startOf('minute').toDate(),
                    END: now.add(48, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_48_HOURS,
                },
                EXPIRES_IN_24_HOURS: {
                    START: now.add(24, 'hour').startOf('minute').toDate(),
                    END: now.add(24, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY.EXPIRES_IN_24_HOURS,
                },
                EXPIRED_24_HOURS_AGO: {
                    START: now.subtract(24, 'hour').startOf('minute').toDate(),
                    END: now.subtract(24, 'hour').endOf('minute').toDate(),
                    NAME: EVENTS.USER.EXPIRE_NOTIFY.EXPIRED_24_HOURS_AGO,
                },
            } as const;

            await pMap(
                Object.values(DATES),
                async (date) => {
                    try {
                        const users = await this.getUsersByExpireAt(date.START, date.END);

                        if (!users.isOk || !users.response) {
                            return;
                        }

                        if (users.response.length === 0) {
                            return;
                        }

                        await pMap(
                            users.response,
                            async (user) => {
                                this.eventEmitter.emit(
                                    date.NAME,
                                    new UserEvent({
                                        user,
                                        event: date.NAME as TUserEvents,
                                    }),
                                );
                            },
                            { concurrency: 100 },
                        );
                    } catch (error) {
                        this.logger.error(error);
                    }
                },
                { concurrency: 4 },
            );
        } catch (error) {
            this.logger.error(
                `Error handling "${ExpireUserNotificationsJobNames.expireUserNotifications}" job: ${error}`,
            );
        }
    }

    private async getUsersByExpireAt(
        start: Date,
        end: Date,
    ): Promise<ICommandResponse<UserEntity[]>> {
        return this.queryBus.execute<GetUsersByExpireAtQuery, ICommandResponse<UserEntity[]>>(
            new GetUsersByExpireAtQuery(start, end),
        );
    }
}
