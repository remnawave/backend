import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { TNodeIntegrationsPayload } from '../../utils/merge-node-integrations.util';

export class GetResolvedIntegrationsQuery extends Query<
    TResult<Map<string, TNodeIntegrationsPayload>>
> {
    constructor(public readonly integrationUuids: string[]) {
        super();
    }
}
