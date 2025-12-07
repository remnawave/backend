import { Prisma } from '@prisma/client';

import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodesEntity } from '@modules/nodes';

export class FindNodesByCriteriaQuery extends Query<TResult<NodesEntity[]>> {
    constructor(public readonly where: Prisma.NodesWhereInput) {
        super();
    }
}
