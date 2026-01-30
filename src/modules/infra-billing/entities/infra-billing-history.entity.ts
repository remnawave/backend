import type { InfraBillingHistoryModel as InfraBillingHistory } from '@generated/prisma/models';

export class InfraBillingHistoryEntity implements InfraBillingHistory {
    public uuid: string;
    public providerUuid: string;
    public amount: number;
    public billedAt: Date;

    public provider: {
        uuid: string;
        name: string;
        faviconLink: string;
    };

    constructor(billingHistory: Partial<InfraBillingHistory>) {
        Object.assign(this, billingHistory);
        return this;
    }
}
