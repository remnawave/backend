import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

import { NodesRepository } from '../../repositories/nodes.repository';
import { UpdateNodeCommand } from './update-node.command';

@CommandHandler(UpdateNodeCommand)
export class UpdateNodeHandler implements ICommandHandler<UpdateNodeCommand, TResult<NodesEntity>> {
    public readonly logger = new Logger(UpdateNodeHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute(command: UpdateNodeCommand): Promise<TResult<NodesEntity>> {
        try {
            const node = await this.nodesRepository.update(command.node);
            return ok(node);
        } catch (error: unknown) {
            this.logger.error(`Error: ${error}`);
            return fail(ERRORS.UPDATE_NODE_ERROR);
        }
    }
}
