import { ExternalSquads } from '@prisma/client';
import z from 'zod';

import {
    ExternalSquadHostOverridesSchema,
    ExternalSquadResponseHeadersSchema,
    ExternalSquadSubscriptionSettingsSchema,
    TCustomRemarks,
    THwidSettings,
} from '@libs/contracts/models';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';

export class ExternalSquadWithInfoEntity implements ExternalSquads {
    public uuid: string;
    public viewPosition: number;
    public name: string;

    public membersCount: number | string | bigint | null;

    public templates: {
        templateUuid: string;
        templateType: TSubscriptionTemplateType;
    }[];

    public subscriptionSettings: z.infer<typeof ExternalSquadSubscriptionSettingsSchema> | null;
    public hostOverrides: z.infer<typeof ExternalSquadHostOverridesSchema> | null;
    public responseHeaders: z.infer<typeof ExternalSquadResponseHeadersSchema> | null;
    public hwidSettings: THwidSettings | null;
    public customRemarks: TCustomRemarks | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(externalSquad: Partial<ExternalSquads>) {
        Object.assign(this, externalSquad);

        this.membersCount = Number(this.membersCount) || 0;

        return this;
    }
}
