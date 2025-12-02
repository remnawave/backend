import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { VacuumNodesUserUsageHistoryCommand } from './vacuum-nodes-user-usage-history.command';

@CommandHandler(VacuumNodesUserUsageHistoryCommand)
export class VacuumNodesUserUsageHistoryHandler implements ICommandHandler<
    VacuumNodesUserUsageHistoryCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(VacuumNodesUserUsageHistoryHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    async execute(): Promise<ICommandResponse<void>> {
        try {
            await this.nodesUserUsageHistoryRepository.vacuumTable();

            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error during vacuum table: ${error}`);
            return {
                isOk: false,
                ...ERRORS.VACUUM_TABLE_ERROR,
            };
        }
    }
}
