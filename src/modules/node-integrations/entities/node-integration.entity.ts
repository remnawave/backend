import { Integrations } from '@prisma/client';

export class NodeIntegrationEntity implements Integrations {
    uuid: string;
    name: string;
    description: string | null;
    config: object;

    createdAt: Date;
    updatedAt: Date;

    constructor(integration: Partial<Integrations>) {
        Object.assign(this, integration);
        return this;
    }
}
