import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { BulkIncrementUsedTrafficCommand } from '@modules/users/commands/bulk-increment-used-traffic';

import { FirstConnectedUsersQueueService } from '@queue/first-connected-users/first-connected-users.service';

import { UpdateUsersUsageJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.updateUsersUsage, {
    concurrency: 5,
})
export class UpdateUsersUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UpdateUsersUsageQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly firstConnectedUsersQueueService: FirstConnectedUsersQueueService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case UpdateUsersUsageJobNames.UpdateUsersUsage:
                return this.handleUpdateUsersUsage(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleUpdateUsersUsage(job: Job<{ u: string; b: string; n: string }[]>) {
        try {
            const userUsageList = job.data;

            const result = await this.bulkIncrementUsedTraffic({
                userUsageList,
            });

            if (!result.isOk || !result.response) {
                throw new Error(JSON.stringify(result));
            }

            if (result.response.length > 0) {
                await this.firstConnectedUsersQueueService.addFirstConnectedUsersBulkJob(
                    result.response,
                );
            }

            return {
                affectedRows: userUsageList.length,
            };
        } catch (error) {
            this.logger.error(
                `Error handling "${UpdateUsersUsageJobNames.UpdateUsersUsage}" job: ${error}`,
            );

            throw new Error(`${error}`);
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
