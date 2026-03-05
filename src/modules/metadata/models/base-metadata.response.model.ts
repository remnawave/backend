import { NodeMetadataEntity, UserMetadataEntity } from '../entities';

export class BaseMetadataResponseModel {
    public readonly metadata: Record<string, unknown>;

    constructor(entity: UserMetadataEntity | NodeMetadataEntity) {
        this.metadata = entity.metadata;
    }
}
