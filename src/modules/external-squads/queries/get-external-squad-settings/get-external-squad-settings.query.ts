import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { ExternalSquadEntity } from '@modules/external-squads/entities';

export class GetExternalSquadSettingsQuery extends Query<
    ICommandResponse<Pick<
        ExternalSquadEntity,
        'subscriptionSettings' | 'hostOverrides' | 'responseHeaders'
    > | null>
> {
    constructor(public readonly externalSquadUuid: string) {
        super();
    }
}
