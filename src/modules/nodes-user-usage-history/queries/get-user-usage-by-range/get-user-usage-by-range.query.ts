import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { IGetUserUsageByRange } from '@modules/users/interfaces';

export class GetUserUsageByRangeQuery extends Query<TResult<IGetUserUsageByRange[]>> {
    constructor(
        public readonly userUuid: string,
        public readonly start: Date,
        public readonly end: Date,
    ) {
        super();
    }
}
