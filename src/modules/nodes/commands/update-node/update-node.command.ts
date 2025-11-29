import { Command } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesEntity } from '../../entities/nodes.entity';

export class UpdateNodeCommand extends Command<ICommandResponse<NodesEntity>> {
    constructor(public readonly node: Partial<NodesEntity>) {
        super();
    }
}
