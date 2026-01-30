import type { SubscriptionPageConfigModel as SubscriptionPageConfig } from '@generated/prisma/models';

export class SubscriptionPageConfigEntity implements SubscriptionPageConfig {
    uuid: string;
    viewPosition: number;
    name: string;
    config: object;

    createdAt: Date;
    updatedAt: Date;
    constructor(config: Partial<SubscriptionPageConfig>) {
        Object.assign(this, config);
        return this;
    }
}
