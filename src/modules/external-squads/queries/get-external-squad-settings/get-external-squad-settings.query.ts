import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { ExternalSquadEntity } from '@modules/external-squads/entities';

export class GetExternalSquadSettingsQuery extends Query<
    TResult<Pick<
        ExternalSquadEntity,
        'subscriptionSettings' | 'hostOverrides' | 'responseHeaders' | 'hwidSettings'
    > | null>
> {
    constructor(public readonly externalSquadUuid: string) {
        super();
    }
}
