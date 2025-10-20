import { ExternalSquads } from '@prisma/client';

import { TSubscriptionTemplateType } from '@libs/contracts/constants';

export class ExternalSquadWithInfoEntity implements ExternalSquads {
    public uuid: string;
    public name: string;

    public membersCount: number | string | bigint | null;

    public templates: {
        templateUuid: string;
        templateType: TSubscriptionTemplateType;
    }[];

    public createdAt: Date;
    public updatedAt: Date;

    constructor(externalSquad: Partial<ExternalSquads>) {
        Object.assign(this, externalSquad);

        this.membersCount = Number(this.membersCount) || 0;

        return this;
    }
}
