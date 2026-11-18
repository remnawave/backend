import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ConfigProfileRepository } from '../../repositories/config-profile.repository';
import { BulkUpsertInboundUsageHistoryCommand } from './bulk-upsert-inbound-usage-history.command';

@CommandHandler(BulkUpsertInboundUsageHistoryCommand)
export class BulkUpsertInboundUsageHistoryHandler implements ICommandHandler<BulkUpsertInboundUsageHistoryCommand> {
    public readonly logger = new Logger(BulkUpsertInboundUsageHistoryHandler.name);

    constructor(private readonly configProfileRepository: ConfigProfileRepository) {}

    async execute(command: BulkUpsertInboundUsageHistoryCommand): Promise<void> {
        try {
            await this.configProfileRepository.bulkUpsertInboundUsageHistory(command.list);
        } catch (error: unknown) {
            this.logger.error(error);
        }
    }
}
