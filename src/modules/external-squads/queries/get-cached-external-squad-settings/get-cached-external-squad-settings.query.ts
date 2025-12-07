import { Query } from '@nestjs/cqrs';

import { ExternalSquadEntity } from '@modules/external-squads/entities';

export class GetCachedExternalSquadSettingsQuery extends Query<Pick<
    ExternalSquadEntity,
    'subscriptionSettings' | 'hostOverrides' | 'responseHeaders' | 'hwidSettings' | 'customRemarks'
> | null> {
    constructor(public readonly externalSquadUuid: string) {
        super();
    }
}
