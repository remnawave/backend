import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
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
                return this.handleUpdateUsersUsage(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleUpdateUsersUsage(job: Job<{ u: string; b: string; n: string }[]>) {
        try {
            const userUsageList = job.data;

            const { isOk, response: firstConnectedUsers } = await this.bulkIncrementUsedTraffic({
                userUsageList,
            });

            if (!isOk || !firstConnectedUsers) {
                throw new Error(JSON.stringify(firstConnectedUsers));
            }

            if (firstConnectedUsers.length > 0) {
                await this.usersQueuesService.fireUserEventBulk({
                    users: firstConnectedUsers,
                    userEvent: EVENTS.USER.FIRST_CONNECTED,
                });
            }

            return {
                isOk: true,
                affectedRows: userUsageList.length,
            };
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.UPDATE_USERS_USAGE}" job: ${error}`,
            );

            return {
                affectedRows: 0,
                isOk: false,
            };
        }
    }

    private async bulkIncrementUsedTraffic(
        dto: BulkIncrementUsedTrafficCommand,
    ): Promise<ICommandResponse<{ tId: bigint }[]>> {
        return this.commandBus.execute<
            BulkIncrementUsedTrafficCommand,
            ICommandResponse<{ tId: bigint }[]>
        >(new BulkIncrementUsedTrafficCommand(dto.userUsageList));
    }
}
