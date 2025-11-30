import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { IncrementUsedTrafficCommand } from './increment-used-traffic.command';
import { NodesRepository } from '../../repositories/nodes.repository';

@CommandHandler(IncrementUsedTrafficCommand)
export class IncrementUsedTrafficHandler implements ICommandHandler<
    IncrementUsedTrafficCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(IncrementUsedTrafficHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    @Transactional()
    async execute(command: IncrementUsedTrafficCommand): Promise<ICommandResponse<void>> {
        try {
            await this.nodesRepository.incrementUsedTraffic(command.nodeUuid, command.bytes);

            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return {
                isOk: false,
                ...ERRORS.INCREMENT_USED_TRAFFIC_ERROR,
            };
        }
    }
}
