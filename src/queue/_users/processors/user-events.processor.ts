import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { EVENTS } from '@libs/contracts/constants/events/events';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { RemoveUserFromNodeEvent } from '@modules/nodes/events/remove-user-from-node';
import { AddUserToNodeEvent } from '@modules/nodes/events/add-user-to-node';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants/users-job-name.constant';
import { IFireUserEventJobData } from '../interfaces';

@Processor(QUEUES_NAMES.USERS.USER_EVENTS, {
    concurrency: 50,
})
export class UserEventsQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UserEventsQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly eventBus: EventBus,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case USERS_JOB_NAMES.FIRE_USER_EVENT:
                return await this.handleFireUserEvent(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleFireUserEvent(job: Job<IFireUserEventJobData>) {
        try {
            const { userEvent, skipTelegramNotification, meta } = job.data;

            const tId = BigInt(job.data.tId);

            const getUserResult = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        tId,
                    },
                    {
                        activeInternalSquads: true,
                    },
                ),
            );

            if (!getUserResult.isOk) {
                return;
            }

            const { response: user } = getUserResult;

            switch (userEvent) {
                case EVENTS.USER.EXPIRED:
                case EVENTS.USER.LIMITED:
                    this.eventEmitter.emit(
                        userEvent as string,
                        new UserEvent({
                            user,
                            event: userEvent,
                        }),
                    );

                    await this.eventBus.publish(
                        new RemoveUserFromNodeEvent(user.tId, user.vlessUuid),
                    );

                    break;

                case EVENTS.USER.BANDWIDTH_USAGE_THRESHOLD_REACHED:
                    this.eventEmitter.emit(
                        userEvent as string,
                        new UserEvent({
                            user,
                            event: userEvent,
                            skipTelegramNotification,
                        }),
                    );
                    break;
                case EVENTS.USER.NOT_CONNECTED:
                    this.eventEmitter.emit(
                        userEvent as string,
                        new UserEvent({
                            user,
                            event: userEvent,
                            meta,
                            skipTelegramNotification,
                        }),
                    );

                    break;
                case EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_72_HOURS:
                case EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_48_HOURS:
                case EVENTS.USER.EXPIRE_NOTIFY_EXPIRES_IN_24_HOURS:
                case EVENTS.USER.EXPIRE_NOTIFY_EXPIRED_24_HOURS_AGO:
                case EVENTS.USER.FIRST_CONNECTED:
                    this.eventEmitter.emit(
                        userEvent as string,
                        new UserEvent({
                            user,
                            event: userEvent,
                        }),
                    );

                    break;
                case EVENTS.USER.ENABLED:
                    this.eventEmitter.emit(
                        userEvent as string,
                        new UserEvent({
                            user,
                            event: userEvent,
                        }),
                    );

                    this.eventBus.publish(new AddUserToNodeEvent(user.uuid));
                    break;
                default:
                    this.logger.warn(`User event "${userEvent}" is not implemented.`);
                    break;
            }
        } catch (error) {
            this.logger.error(`Error handling "${USERS_JOB_NAMES.FIRE_USER_EVENT}" job: ${error}`);
        }
    }
}
