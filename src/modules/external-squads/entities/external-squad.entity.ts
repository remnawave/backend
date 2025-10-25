import { ExternalSquads } from '@prisma/client';
import z from 'zod';

import { ExternalSquadSubscriptionSettingsSchema } from '@libs/contracts/models';

export class ExternalSquadEntity implements ExternalSquads {
    public uuid: string;
    public name: string;

    public subscriptionSettings: z.infer<typeof ExternalSquadSubscriptionSettingsSchema> | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(externalSquad: Partial<ExternalSquads>) {
        Object.assign(this, externalSquad);
        return this;
    }
}
