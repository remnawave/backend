import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { ExpectedUserRow } from '../../repositories/nodes.repository';

export class GetExpectedUsersQuery extends Query<TResult<ExpectedUserRow[]>> {
    constructor(public readonly nodeUuid: string) {
        super();
    }
}
