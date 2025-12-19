import { ExternalSquads } from '@prisma/client';
import z from 'zod';

import {
    ExternalSquadHostOverridesSchema,
    ExternalSquadResponseHeadersSchema,
    ExternalSquadSubscriptionSettingsSchema,
    TCustomRemarks,
    THwidSettings,
} from '@libs/contracts/models';

export class ExternalSquadEntity implements ExternalSquads {
    public uuid: string;
    public viewPosition: number;
    public name: string;

    public subscriptionSettings: z.infer<typeof ExternalSquadSubscriptionSettingsSchema> | null;
    public hostOverrides: z.infer<typeof ExternalSquadHostOverridesSchema> | null;
    public responseHeaders: z.infer<typeof ExternalSquadResponseHeadersSchema> | null;

    public hwidSettings: THwidSettings | null;
    public customRemarks: TCustomRemarks | null;
    public subpageConfigUuid: string | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(externalSquad: Partial<ExternalSquads>) {
        Object.assign(this, externalSquad);
        return this;
    }
}
