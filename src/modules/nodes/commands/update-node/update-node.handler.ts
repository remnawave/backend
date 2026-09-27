import { ERRORS } from '@contract/constants';
import { Prisma } from '@prisma/client';

import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
            const node = await this.nodesRepository.update(command.node, command.expectedState);
            return ok(node);
        } catch (error: unknown) {
            if (
                command.expectedState &&
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.debug(
                    `Skipped outdated connection update for node ${command.node.uuid}`,
                );
                return fail(ERRORS.UPDATE_NODE_ERROR);
            }

            this.logger.error(`Error: ${error}`);
            return fail(ERRORS.UPDATE_NODE_ERROR);
        }
    }
}
