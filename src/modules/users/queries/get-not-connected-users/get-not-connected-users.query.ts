import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { UserEntity } from '@modules/users/entities';

export class GetNotConnectedUsersQuery extends Query<TResult<UserEntity[]>> {
    constructor(
        public readonly startDate: Date,
        public readonly endDate: Date,
    ) {
        super();
    }
}
