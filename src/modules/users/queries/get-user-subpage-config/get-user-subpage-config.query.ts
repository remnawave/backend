import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetUserSubpageConfigQuery extends Query<TResult<string | null>> {
    constructor(public readonly shortUuid: string) {
        super();
    }
}
