import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetProfileUuidsByIntegrationUuidQuery extends Query<TResult<string[]>> {
    constructor(public readonly integrationUuid: string) {
        super();
    }
}
