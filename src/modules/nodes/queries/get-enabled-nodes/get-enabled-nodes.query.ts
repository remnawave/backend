import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodesEntity } from '../../entities/nodes.entity';

export class GetEnabledNodesQuery extends Query<TResult<NodesEntity[]>> {
    constructor() {
        super();
    }
}
