import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { NodesTrafficUsageHistoryRepository } from '../../repositories/nodes-traffic-usage-history.repository';
import { CreateNodeTrafficUsageHistoryCommand } from './create-node-traffic-usage-history.command';

@CommandHandler(CreateNodeTrafficUsageHistoryCommand)
export class CreateNodeTrafficUsageHistoryHandler implements ICommandHandler<CreateNodeTrafficUsageHistoryCommand> {
    public readonly logger = new Logger(CreateNodeTrafficUsageHistoryHandler.name);

    constructor(
        private readonly nodesTrafficUsageHistoryRepository: NodesTrafficUsageHistoryRepository,
    ) {}

    async execute(command: CreateNodeTrafficUsageHistoryCommand) {
        try {
            await this.nodesTrafficUsageHistoryRepository.create(command.nodeTrafficUsageHistory);

            return;
        } catch (error: unknown) {
            this.logger.error(`Error: ${error}`);
            return;
        }
    }
}
