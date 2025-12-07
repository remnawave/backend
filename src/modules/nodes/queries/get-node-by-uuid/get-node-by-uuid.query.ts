import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodesEntity } from '../../entities/nodes.entity';

export class GetNodeByUuidQuery extends Query<TResult<NodesEntity>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
