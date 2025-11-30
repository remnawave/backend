import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { BulkUpsertUserHistoryEntryCommand } from './bulk-upsert-user-history-entry.command';

@CommandHandler(BulkUpsertUserHistoryEntryCommand)
export class BulkUpsertUserHistoryEntryHandler implements ICommandHandler<
    BulkUpsertUserHistoryEntryCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(BulkUpsertUserHistoryEntryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute(command: BulkUpsertUserHistoryEntryCommand): Promise<ICommandResponse<void>> {
        try {
            await this.nodesUserUsageHistoryRepository.bulkUpsertUsageHistory(
                command.userUsageHistoryList,
            );
            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_NODE_ERROR,
            };
        }
    }
}
