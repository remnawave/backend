import { NodeIntegrationEntity } from '../entities/node-integration.entity';

export class BaseNodeIntegrationResponseModel {
    public uuid: string;
    public name: string;
    public description: string | null;
    public config: Record<string, unknown>;

    constructor(entity: NodeIntegrationEntity) {
        this.uuid = entity.uuid;
        this.name = entity.name;
        this.description = entity.description ?? null;
        this.config = (entity.config ?? {}) as Record<string, unknown>;
    }
}
