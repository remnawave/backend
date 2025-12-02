import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { TruncateNodesUserUsageHistoryCommand } from './truncate-nodes-user-usage-history.command';

@CommandHandler(TruncateNodesUserUsageHistoryCommand)
export class TruncateNodesUserUsageHistoryHandler implements ICommandHandler<
    TruncateNodesUserUsageHistoryCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(TruncateNodesUserUsageHistoryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute(): Promise<ICommandResponse<void>> {
        try {
            await this.nodesUserUsageHistoryRepository.truncateTable();

            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error during truncate table: ${error}`);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
