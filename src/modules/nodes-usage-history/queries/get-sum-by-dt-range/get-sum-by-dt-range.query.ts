import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetSumByDtRangeQuery extends Query<TResult<bigint>> {
    constructor(
        public readonly start: Date,
        public readonly end: Date,
    ) {
        super();
    }
}
