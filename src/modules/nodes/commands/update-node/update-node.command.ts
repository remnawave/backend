import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodesEntity } from '../../entities/nodes.entity';

export class UpdateNodeCommand extends Command<TResult<NodesEntity>> {
    constructor(public readonly node: Partial<NodesEntity>) {
        super();
    }
}
