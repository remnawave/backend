import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { TruncateNodesUserUsageHistoryCommand } from './truncate-nodes-user-usage-history.command';

@CommandHandler(TruncateNodesUserUsageHistoryCommand)
export class TruncateNodesUserUsageHistoryHandler implements ICommandHandler<TruncateNodesUserUsageHistoryCommand> {
    public readonly logger = new Logger(TruncateNodesUserUsageHistoryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute() {
        try {
            await this.nodesUserUsageHistoryRepository.truncateTable();

            return;
        } catch (error: unknown) {
            this.logger.error(`Error during truncate table: ${error}`);
            return;
        }
    }
}
