import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { INodeHotCache } from '@modules/nodes/interfaces';

export class GetNodesSystemStatsQuery extends Query<TResult<Map<string, INodeHotCache>>> {
    constructor(public readonly nodes: { uuid: string }[]) {
        super();
    }
}
