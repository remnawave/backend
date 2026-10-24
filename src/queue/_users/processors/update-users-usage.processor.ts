import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { ok } from '@common/types';
import { EVENTS } from '@libs/contracts/constants';

import { BulkIncrementUsedTrafficCommand } from '@modules/users/commands/bulk-increment-used-traffic';

import { UsersQueuesService } from '@queue/_users/users-queues.service';
import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants/users-job-name.constant';

@Processor(QUEUES_NAMES.USERS.UPDATE_USERS_USAGE, {
    concurrency: 5,
})
export class UpdateUsersUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UpdateUsersUsageQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case USERS_JOB_NAMES.UPDATE_USERS_USAGE:
                return await this.handleUpdateUsersUsage(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleUpdateUsersUsage(job: Job<{ u: string; b: string; n: string }[]>) {
        const userUsageList = job.data;

        const updatedUsers = await this.commandBus.execute(
            new BulkIncrementUsedTrafficCommand(userUsageList),
        );

        if (!updatedUsers.isOk) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.UPDATE_USERS_USAGE}" job: ${JSON.stringify(updatedUsers)}`,
            );

            // Rethrow so BullMQ retries the job (attempts: 3): the increment is a single statement, so nothing was applied.
            throw new Error(JSON.stringify(updatedUsers));
        }

        if (updatedUsers.response.length > 0) {
            try {
                await this.usersQueuesService.fireUserEventBulk({
                    users: updatedUsers.response,
                    userEvent: EVENTS.USER.FIRST_CONNECTED,
                });
            } catch (error) {
                // Traffic is already applied here: retrying the job would count it twice.
                this.logger.error(
                    `Error handling "${USERS_JOB_NAMES.UPDATE_USERS_USAGE}" job: ${error}`,
                );
            }
        }

        return ok({
            affectedRows: userUsageList.length,
        });
    }
}
