import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { UserWithResolvedInboundEntity } from '@modules/users/entities';

export class GetUsersWithResolvedInboundsQuery extends Query<
    TResult<UserWithResolvedInboundEntity[]>
> {
    constructor(public readonly tIds: bigint[]) {
        super();
    }
}
