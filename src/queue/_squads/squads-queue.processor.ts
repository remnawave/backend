import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { GetAffectedConfigProfilesBySquadUuidQuery } from '@modules/internal-squads/queries/get-affected-config-profiles-by-squad-uuid';
import { ExternalSquadBulkActionsCommand } from '@modules/external-squads/commands/external-squad-bulk-actions';
import { InternalSquadBulkActionsCommand } from '@modules/internal-squads/commands/internal-squad-bulk-actions';

import { NodesQueuesService } from '@queue/_nodes';

import { SQUADS_JOB_NAMES } from './constants';
import { QUEUES_NAMES } from '../queue.enum';

@Processor(QUEUES_NAMES.SQUADS.ACTIONS, {
    concurrency: 1,
})
export class SquadsQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(SquadsQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case SQUADS_JOB_NAMES.ADD_USERS_TO_EXTERNAL_SQUAD:
                return await this.handleAddUsersToExternalSquad(job);
            case SQUADS_JOB_NAMES.REMOVE_USERS_FROM_EXTERNAL_SQUAD:
                return await this.handleRemoveUsersFromExternalSquad(job);
            case SQUADS_JOB_NAMES.ADD_USERS_TO_INTERNAL_SQUAD:
                return await this.handleAddUsersToInternalSquad(job);
            case SQUADS_JOB_NAMES.REMOVE_USERS_FROM_INTERNAL_SQUAD:
                return await this.handleRemoveUsersFromInternalSquad(job);

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
                `Error handling "${SQUADS_JOB_NAMES.ADD_USERS_TO_EXTERNAL_SQUAD}" job: ${error}`,
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
                `Error handling "${SQUADS_JOB_NAMES.REMOVE_USERS_FROM_EXTERNAL_SQUAD}" job: ${error}`,
            );
        }
    }

    private async handleAddUsersToInternalSquad(job: Job) {
        try {
            const { internalSquadUuid } = job.data;

            const result = await this.commandBus.execute(
                new InternalSquadBulkActionsCommand(internalSquadUuid, 'add'),
            );

            await this.restartNodesByConfigProfiles(internalSquadUuid);

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${SQUADS_JOB_NAMES.ADD_USERS_TO_INTERNAL_SQUAD}" job: ${error}`,
            );
        }
    }

    private async handleRemoveUsersFromInternalSquad(job: Job) {
        try {
            const { internalSquadUuid } = job.data;

            const result = await this.commandBus.execute(
                new InternalSquadBulkActionsCommand(internalSquadUuid, 'remove'),
            );

            await this.restartNodesByConfigProfiles(internalSquadUuid);

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${SQUADS_JOB_NAMES.REMOVE_USERS_FROM_INTERNAL_SQUAD}" job: ${error}`,
            );
        }
    }

    private async restartNodesByConfigProfiles(internalSquadUuid: string): Promise<boolean> {
        try {
            const configProfiles = await this.queryBus.execute(
                new GetAffectedConfigProfilesBySquadUuidQuery(internalSquadUuid),
            );

            if (!configProfiles.isOk) {
                return false;
            }

            const configProfilesUuids = configProfiles.response;

            if (configProfilesUuids.length === 0) {
                return false;
            }

            this.logger.log(
                `Restarting nodes by config profiles: ${JSON.stringify(configProfilesUuids)}`,
            );

            for (const configProfileUuid of configProfilesUuids) {
                await this.nodesQueuesService.startAllNodesByProfile({
                    profileUuid: configProfileUuid,
                    emitter: 'internal-squad-actions',
                });
            }

            return true;
        } catch (error) {
            this.logger.error(error);
            return false;
        }
    }
}
