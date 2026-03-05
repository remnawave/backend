import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetNodeIdByUuidQuery extends Query<TResult<bigint | null>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
