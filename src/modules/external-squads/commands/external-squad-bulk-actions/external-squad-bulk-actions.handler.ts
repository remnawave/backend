import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';

import { ExternalSquadBulkActionsCommand } from './external-squad-bulk-actions.command';
import { ExternalSquadRepository } from '../../repositories/external-squad.repository';

@CommandHandler(ExternalSquadBulkActionsCommand)
export class ExternalSquadBulkActionsHandler implements ICommandHandler<
    ExternalSquadBulkActionsCommand,
    TResult<{
        affectedRows: number;
    }>
> {
    public readonly logger = new Logger(ExternalSquadBulkActionsHandler.name);

    constructor(private readonly externalSquadRepository: ExternalSquadRepository) {}

    async execute(command: ExternalSquadBulkActionsCommand): Promise<
        TResult<{
            affectedRows: number;
        }>
    > {
        try {
            const { action, externalSquadUuid } = command;

            let affectedRows = 0;
            if (action === 'add') {
                const result =
                    await this.externalSquadRepository.addUsersToExternalSquad(externalSquadUuid);
                affectedRows = result.affectedCount;
            } else if (action === 'remove') {
                const result =
                    await this.externalSquadRepository.removeUsersFromExternalSquad(
                        externalSquadUuid,
                    );
                affectedRows = result.affectedCount;
            }

            return ok({ affectedRows });
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
