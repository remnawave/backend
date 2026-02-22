import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetUserIdsByUserUuidsQuery extends Query<TResult<bigint[]>> {
    constructor(public readonly userUuids: string[]) {
        super();
    }
}
