import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetSumLifetimeQuery extends Query<
    TResult<{
        totalBytes: string;
    }>
> {
    constructor() {
        super();
    }
}
