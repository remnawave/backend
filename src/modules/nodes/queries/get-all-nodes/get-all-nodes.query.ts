import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

export class GetAllNodesQuery extends Query<TResult<NodesEntity[]>> {
    constructor() {
        super();
    }
}
