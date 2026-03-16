import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { INodeSystem } from '@modules/nodes/interfaces';

export class GetNodesSystemStatsQuery extends Query<TResult<Map<string, INodeSystem | null>>> {
    constructor(public readonly nodes: { uuid: string }[]) {
        super();
    }
}
