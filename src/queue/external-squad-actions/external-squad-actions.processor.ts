import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ExternalSquadBulkActionsCommand } from '@modules/external-squads/commands/external-squad-bulk-actions';

import { ExternalSquadActionsJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.externalSquadActions, {
    concurrency: 1,
})
export class ExternalSquadActionsQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ExternalSquadActionsQueueProcessor.name);

    constructor(private readonly commandBus: CommandBus) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case ExternalSquadActionsJobNames.addUsersToExternalSquad:
                return this.handleAddUsersToExternalSquad(job);
            case ExternalSquadActionsJobNames.removeUsersFromExternalSquad:
                return this.handleRemoveUsersFromExternalSquad(job);

            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleAddUsersToExternalSquad(job: Job) {
        try {
            const { externalSquadUuid } = job.data;

            const result = await this.commandBus.execute(
                new ExternalSquadBulkActionsCommand(externalSquadUuid, 'add'),
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${ExternalSquadActionsJobNames.addUsersToExternalSquad}" job: ${error}`,
            );
        }
    }

    private async handleRemoveUsersFromExternalSquad(job: Job) {
        try {
            const { externalSquadUuid } = job.data;

            const result = await this.commandBus.execute(
                new ExternalSquadBulkActionsCommand(externalSquadUuid, 'remove'),
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${ExternalSquadActionsJobNames.removeUsersFromExternalSquad}" job: ${error}`,
            );
        }
    }
}
