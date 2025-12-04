import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetUsersByExpireAtQuery extends Query<TResult<{ tId: bigint }[]>> {
    constructor(
        public readonly start: Date,
        public readonly end: Date,
    ) {
        super();
    }
}
