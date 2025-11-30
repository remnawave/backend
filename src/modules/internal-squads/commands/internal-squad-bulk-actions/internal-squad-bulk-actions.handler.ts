import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { InternalSquadBulkActionsCommand } from './internal-squad-bulk-actions.command';
import { InternalSquadRepository } from '../../repositories/internal-squad.repository';

@CommandHandler(InternalSquadBulkActionsCommand)
export class InternalSquadBulkActionsHandler implements ICommandHandler<
    InternalSquadBulkActionsCommand,
    ICommandResponse<{
        affectedRows: number;
    }>
> {
    public readonly logger = new Logger(InternalSquadBulkActionsHandler.name);

    constructor(private readonly internalSquadRepository: InternalSquadRepository) {}

    @Transactional()
    async execute(command: InternalSquadBulkActionsCommand): Promise<
        ICommandResponse<{
            affectedRows: number;
        }>
    > {
        try {
            const { action, internalSquadUuid } = command;

            let affectedRows = 0;
            if (action === 'add') {
                const result =
                    await this.internalSquadRepository.addUsersToInternalSquad(internalSquadUuid);
                affectedRows = result.affectedCount;
            } else if (action === 'remove') {
                const result =
                    await this.internalSquadRepository.removeUsersFromInternalSquad(
                        internalSquadUuid,
                    );
                affectedRows = result.affectedCount;
            }

            return {
                isOk: true,
                response: {
                    affectedRows,
                },
            };
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SQUAD_BULK_ACTIONS_ERROR,
            };
        }
    }
}
