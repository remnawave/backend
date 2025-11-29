import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { TruncateNodesUserUsageHistoryCommand } from '@modules/nodes-user-usage-history/commands/truncate-nodes-user-usage-history';
import { VacuumNodesUserUsageHistoryCommand } from '@modules/nodes-user-usage-history/commands/vacuum-nodes-user-usage-history';
import { TruncateUserTrafficHistoryCommand } from '@modules/user-traffic-history/commands/truncate-user-traffic-history';

import { UsersQueuesService } from '@queue/_users';

import { QUEUES_NAMES } from '../queue.enum';
import { ServiceJobNames } from './enums';

@Processor(QUEUES_NAMES.SERVICE, {
    concurrency: 1,
})
export class ServiceQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ServiceQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case ServiceJobNames.CLEAN_OLD_USAGE_RECORDS:
                return this.handleCleanOldUsageRecordsJob();
            case ServiceJobNames.VACUUM_TABLES:
                return this.handleVacuumTablesJob();
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleCleanOldUsageRecordsJob() {
        try {
            await this.usersQueuesService.queues.updateUsersUsage.pause();

            this.logger.log('Resetting tables...');

            await this.truncateUserTrafficHistory();

            await this.truncateNodesUserUsageHistory();

            await this.vacuumTable();

            this.logger.log('Tables resetted');
        } catch (error) {
            this.logger.error(
                `Error handling "${ServiceJobNames.CLEAN_OLD_USAGE_RECORDS}" job: ${error}`,
            );
        } finally {
            await this.usersQueuesService.queues.updateUsersUsage.resume();
        }
    }

    private async handleVacuumTablesJob() {
        try {
            await this.vacuumTable();

            this.logger.log('Tables vacuumed successfully.');
        } catch (error) {
            this.logger.error(`Error handling "${ServiceJobNames.VACUUM_TABLES}" job: ${error}`);
        }
    }

    private async truncateNodesUserUsageHistory(): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<
            TruncateNodesUserUsageHistoryCommand,
            ICommandResponse<void>
        >(new TruncateNodesUserUsageHistoryCommand());
    }

    private async truncateUserTrafficHistory(): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<TruncateUserTrafficHistoryCommand, ICommandResponse<void>>(
            new TruncateUserTrafficHistoryCommand(),
        );
    }

    private async vacuumTable(): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<VacuumNodesUserUsageHistoryCommand, ICommandResponse<void>>(
            new VacuumNodesUserUsageHistoryCommand(),
        );
    }
}
