import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { DeleteNodeByUuidCommand } from './delete-node-by-uuid.command';
import { NodesRepository } from '../../repositories/nodes.repository';

@CommandHandler(DeleteNodeByUuidCommand)
export class DeleteNodeByUuidHandler implements ICommandHandler<DeleteNodeByUuidCommand> {
    public readonly logger = new Logger(DeleteNodeByUuidHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    @Transactional()
    async execute(command: DeleteNodeByUuidCommand) {
        try {
            await this.nodesRepository.deleteByUUID(command.uuid);
            return;
        } catch (error: unknown) {
            this.logger.error(`Error: ${error}`);
            return;
        }
    }
}
