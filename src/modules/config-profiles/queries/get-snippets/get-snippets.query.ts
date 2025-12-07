import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { SnippetEntity } from '@modules/config-profiles/entities';

export class GetSnippetsQuery extends Query<TResult<SnippetEntity[]>> {
    constructor() {
        super();
    }
}
