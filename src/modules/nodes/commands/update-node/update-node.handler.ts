import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Logger } from '@nestjs/common';
import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@contract/constants';
import { UpdateNodeCommand } from './update-node.command';
import { NodesRepository } from '../../repositories/nodes.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

@CommandHandler(UpdateNodeCommand)
export class UpdateNodeHandler
    implements ICommandHandler<UpdateNodeCommand, ICommandResponse<NodesEntity>>
{
    public readonly logger = new Logger(UpdateNodeHandler.name);

    constructor(private readonly nodesRepository: NodesRepository) {}

    @Transactional()
    async execute(command: UpdateNodeCommand): Promise<ICommandResponse<NodesEntity>> {
        try {
            const node = await this.nodesRepository.update(command.node);
            return {
                isOk: true,
                response: node,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return {
                isOk: false,
                ...ERRORS.UPDATE_NODE_ERROR,
            };
        }
    }
}
