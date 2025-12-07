import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { VacuumNodesUserUsageHistoryCommand } from './vacuum-nodes-user-usage-history.command';

@CommandHandler(VacuumNodesUserUsageHistoryCommand)
export class VacuumNodesUserUsageHistoryHandler implements ICommandHandler<VacuumNodesUserUsageHistoryCommand> {
    public readonly logger = new Logger(VacuumNodesUserUsageHistoryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute() {
        try {
            await this.nodesUserUsageHistoryRepository.vacuumTable();

            return;
        } catch (error: unknown) {
            this.logger.error(`Error during vacuum table: ${error}`);
            return;
        }
    }
}
