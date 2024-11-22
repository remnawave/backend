import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Logger } from '@nestjs/common';
import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@contract/constants';
import { UpsertUserHistoryEntryCommand } from './upsert-user-history-entry.command';
import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpsertUserHistoryEntryCommand)
export class UpsertUserHistoryEntryHandler
    implements ICommandHandler<UpsertUserHistoryEntryCommand, ICommandResponse<void>>
{
    public readonly logger = new Logger(UpsertUserHistoryEntryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    @Transactional()
    async execute(command: UpsertUserHistoryEntryCommand): Promise<ICommandResponse<void>> {
        try {
            command.userUsageHistory.createdAt.setMinutes(0, 0, 0);
            await this.nodesUserUsageHistoryRepository.upsertUsageHistory(command.userUsageHistory);
            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return {
                isOk: false,
                ...ERRORS.UPDATE_NODE_ERROR,
            };
        }
    }
}