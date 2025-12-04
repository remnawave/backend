import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { NodesUsageHistoryRepository } from '../../repositories/nodes-usage-history.repository';
import { UpsertHistoryEntryCommand } from './upsert-history-entry.command';

@CommandHandler(UpsertHistoryEntryCommand)
export class UpsertHistoryEntryHandler implements ICommandHandler<UpsertHistoryEntryCommand> {
    public readonly logger = new Logger(UpsertHistoryEntryHandler.name);

    constructor(private readonly nodesUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async execute(command: UpsertHistoryEntryCommand) {
        try {
            command.nodeUsageHistory.createdAt.setMinutes(0, 0, 0);
            await this.nodesUsageHistoryRepository.upsertUsageHistory(command.nodeUsageHistory);
            return;
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return;
        }
    }
}
