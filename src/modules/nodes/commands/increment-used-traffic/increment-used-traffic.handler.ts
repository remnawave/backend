import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { IncrementUsedTrafficCommand } from './increment-used-traffic.command';
import { NodesRepository } from '../../repositories/nodes.repository';

@CommandHandler(IncrementUsedTrafficCommand)
export class IncrementUsedTrafficHandler implements ICommandHandler<IncrementUsedTrafficCommand> {
    public readonly logger = new Logger(IncrementUsedTrafficHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(command: IncrementUsedTrafficCommand) {
        try {
            await this.nodesRepository.incrementUsedTraffic(command.nodeUuid, command.bytes);

            return;
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return;
        }
    }
}
