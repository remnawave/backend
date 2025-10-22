import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { EVENTS } from '@libs/contracts/constants';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import { FirstConnectedUsersJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.firstConnectedUsers, {
    concurrency: 50,
})
export class FirstConnectedUsersQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(FirstConnectedUsersQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case FirstConnectedUsersJobNames.handleFirstConnectedUsers:
                return this.handleFirstConnectedUsers(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }

        return { isOk: true };
    }

    private async handleFirstConnectedUsers(job: Job<{ uuid: string }>) {
        try {
            const userUuids = job.data;

            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuids.uuid,
                    },
                    {
                        activeInternalSquads: true,
                        lastConnectedNode: true,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return { isOk: false };
            }

            this.eventEmitter.emit(
                EVENTS.USER.FIRST_CONNECTED,
                new UserEvent({
                    user: user.response,
                    event: EVENTS.USER.FIRST_CONNECTED,
                }),
            );
        } catch (error) {
            this.logger.error(
                `Error handling "${FirstConnectedUsersJobNames.handleFirstConnectedUsers}" job: ${error}`,
            );
        }
    }
}
