import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { BulkUpsertUserHistoryEntryCommand } from './bulk-upsert-user-history-entry.command';

@CommandHandler(BulkUpsertUserHistoryEntryCommand)
export class BulkUpsertUserHistoryEntryHandler implements ICommandHandler<BulkUpsertUserHistoryEntryCommand> {
    public readonly logger = new Logger(BulkUpsertUserHistoryEntryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute(command: BulkUpsertUserHistoryEntryCommand) {
        try {
            await this.nodesUserUsageHistoryRepository.bulkUpsertUsageHistory(
                command.userUsageHistoryList,
            );
            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
