import type { InfraBillingNodesModel as InfraBillingNodes } from '@generated/prisma/models';

import { NodesEntity } from '@modules/nodes/entities';

import { InfraProviderEntity } from './infra-provider.entity';

export class InfraBillingNodeEntity implements InfraBillingNodes {
    public uuid: string;
    public nodeUuid: string;
    public providerUuid: string;
    public nextBillingAt: Date;

    public createdAt: Date;
    public updatedAt: Date;

    public provider: Pick<InfraProviderEntity, 'uuid' | 'name' | 'faviconLink' | 'loginUrl'>;
    public node: Pick<NodesEntity, 'uuid' | 'name' | 'countryCode'>;

    constructor(billingNode: Partial<InfraBillingNodes>) {
        Object.assign(this, billingNode);
        return this;
    }
}
