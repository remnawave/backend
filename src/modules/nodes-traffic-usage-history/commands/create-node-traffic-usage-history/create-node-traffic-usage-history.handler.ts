import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesTrafficUsageHistoryRepository } from '../../repositories/nodes-traffic-usage-history.repository';
import { CreateNodeTrafficUsageHistoryCommand } from './create-node-traffic-usage-history.command';

@CommandHandler(CreateNodeTrafficUsageHistoryCommand)
export class CreateNodeTrafficUsageHistoryHandler implements ICommandHandler<
    CreateNodeTrafficUsageHistoryCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(CreateNodeTrafficUsageHistoryHandler.name);

    constructor(
        private readonly nodesTrafficUsageHistoryRepository: NodesTrafficUsageHistoryRepository,
    ) {}

    async execute(command: CreateNodeTrafficUsageHistoryCommand): Promise<ICommandResponse<void>> {
        try {
            await this.nodesTrafficUsageHistoryRepository.create(command.nodeTrafficUsageHistory);
            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${error}`);
            return {
                isOk: false,
                ...ERRORS.UPDATE_NODE_ERROR,
            };
        }
    }
}
