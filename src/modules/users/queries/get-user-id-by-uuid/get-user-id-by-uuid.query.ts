import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetUserIdByUuidQuery extends Query<TResult<bigint | null>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
