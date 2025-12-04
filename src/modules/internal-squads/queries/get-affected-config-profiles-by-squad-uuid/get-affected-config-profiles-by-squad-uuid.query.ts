import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetAffectedConfigProfilesBySquadUuidQuery extends Query<TResult<string[]>> {
    constructor(public readonly internalSquadUuid: string) {
        super();
    }
}
