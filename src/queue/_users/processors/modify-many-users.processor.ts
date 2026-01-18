import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { RevokeUserSubscriptionCommand } from '@modules/users/commands/revoke-user-subscription';
import { UpdateUserWithServiceCommand } from '@modules/users/commands/update-user-with-service';
import { ResetUserTrafficCommand } from '@modules/users/commands/reset-user-traffic';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants/users-job-name.constant';

@Processor(QUEUES_NAMES.USERS.MODIFY_MANY, {
    concurrency: 50,
})
export class UsersModifyManyQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UsersModifyManyQueueProcessor.name);

    constructor(private readonly commandBus: CommandBus) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case USERS_JOB_NAMES.RESET_MANY_USERS_TRAFFIC:
                return this.handleResetUsersTrafficJob(job);
            case USERS_JOB_NAMES.REVOKE_MANY_USERS_SUBSCRIPTION:
                return this.handleRevokeUsersSubscriptionJob(job);
            case USERS_JOB_NAMES.UPDATE_MANY_USERS:
                return this.handleUpdateUsersJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleResetUsersTrafficJob(job: Job) {
        try {
            const { uuid } = job.data;

            await this.commandBus.execute(new ResetUserTrafficCommand(uuid));

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.RESET_MANY_USERS_TRAFFIC}" job: ${error}`,
            );

            return;
        }
    }

    private async handleRevokeUsersSubscriptionJob(job: Job) {
        try {
            const { uuid } = job.data;

            await this.commandBus.execute(new RevokeUserSubscriptionCommand(uuid));

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.REVOKE_MANY_USERS_SUBSCRIPTION}" job: ${error}`,
            );
        }
    }

    private async handleUpdateUsersJob(job: Job) {
        try {
            const { uuid, fields } = job.data;

            await this.commandBus.execute(
                new UpdateUserWithServiceCommand({
                    uuid: uuid,
                    ...fields,
                    trafficLimitBytes:
                        fields.trafficLimitBytes !== undefined
                            ? Number(fields.trafficLimitBytes)
                            : undefined,
                    telegramId:
                        fields.telegramId !== undefined
                            ? fields.telegramId === null
                                ? null
                                : Number(fields.telegramId)
                            : undefined,
                    description: fields.description !== undefined ? fields.description : undefined,
                    email: fields.email !== undefined ? fields.email : undefined,
                    hwidDeviceLimit: fields.hwidDeviceLimit,
                    activeInternalSquads: fields.activeInternalSquads,
                }),
            );

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.UPDATE_MANY_USERS}" job: ${error}`,
            );
        }
    }
}
