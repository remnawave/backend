import { Prisma } from '@prisma/client';

import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesEntity } from '@modules/nodes';

export class FindNodesByCriteriaQuery extends Query<ICommandResponse<NodesEntity[]>> {
    constructor(public readonly where: Prisma.NodesWhereInput) {
        super();
    }
}
