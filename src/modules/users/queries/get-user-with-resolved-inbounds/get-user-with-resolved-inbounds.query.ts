import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { UserWithResolvedInboundEntity } from '@modules/users/entities';

export class GetUserWithResolvedInboundsQuery extends Query<
    TResult<UserWithResolvedInboundEntity>
> {
    constructor(public readonly userUuid: string) {
        super();
    }
}
