import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesRepository } from '@modules/nodes/repositories/nodes.repository';

import { SyncActiveProfileCommand } from './sync-active-profile.command';

@CommandHandler(SyncActiveProfileCommand)
export class SyncActiveProfileHandler implements ICommandHandler<
    SyncActiveProfileCommand,
    ICommandResponse<{
        affectedRows: number;
    }>
> {
    public readonly logger = new Logger(SyncActiveProfileHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(): Promise<
        ICommandResponse<{
            affectedRows: number;
        }>
    > {
        try {
            const affectedRows =
                await this.nodesRepository.clearActiveConfigProfileForNodesWithoutInbounds();

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
                ...ERRORS.SYNC_ACTIVE_PROFILE_ERROR,
            };
        }
    }
}
