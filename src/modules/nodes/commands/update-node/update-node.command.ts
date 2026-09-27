import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodesConnectionState, NodesEntity } from '../../entities/nodes.entity';

export class UpdateNodeCommand extends Command<TResult<NodesEntity>> {
    constructor(
        public readonly node: Partial<NodesEntity>,
        public readonly expectedState?: Partial<NodesConnectionState>,
    ) {
        super();
    }
}
