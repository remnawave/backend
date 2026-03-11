import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetUsersRecapQuery extends Query<
    TResult<{ total: number; newUsersThisMonth: number }>
> {
    constructor() {
        super();
    }
}
