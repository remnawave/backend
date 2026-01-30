import type { InfraProvidersModel as InfraProviders } from '@generated/prisma/models';

export class InfraProviderEntity implements InfraProviders {
    public name: string;
    public uuid: string;
    public faviconLink: string | null;
    public loginUrl: string | null;

    public createdAt: Date;
    public updatedAt: Date;

    public billingHistory: {
        totalAmount: number;
        totalBills: number;
    };
    public billingNodes: {
        nodeUuid: string;
        name: string;
        countryCode: string;
    }[];

    constructor(provider: Partial<InfraProviders>) {
        Object.assign(this, provider);
        return this;
    }
}
