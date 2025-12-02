import { ConfigProfileInboundEntity } from '../entities/config-profile-inbound.entity';
import { ConfigProfileWithInboundsAndNodesEntity } from '../entities';

export class GetConfigProfileByUuidResponseModel {
    public readonly uuid: string;
    public readonly viewPosition: number;
    public readonly name: string;
    public readonly config: object;
    public readonly inbounds: ConfigProfileInboundEntity[];
    public readonly nodes: {
        uuid: string;
        name: string;
        countryCode: string;
    }[];

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(entity: ConfigProfileWithInboundsAndNodesEntity) {
        this.uuid = entity.uuid;
        this.viewPosition = entity.viewPosition;
        this.name = entity.name;
        this.config = entity.config as object;
        this.inbounds = entity.inbounds;
        this.nodes = entity.nodes;

        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}
