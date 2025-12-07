import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

import { InternalSquadWithInfoEntity } from '../entities/internal-squad-with-info.entity';

export class GetInternalSquadByUuidResponseModel {
    public readonly uuid: string;
    public readonly viewPosition: number;
    public readonly name: string;
    public readonly info: {
        membersCount: number;
        inboundsCount: number;
    };
    public readonly inbounds: ConfigProfileInboundEntity[];

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(entity: InternalSquadWithInfoEntity) {
        this.uuid = entity.uuid;
        this.viewPosition = entity.viewPosition;
        this.name = entity.name;
        this.info = {
            membersCount: Number(entity.membersCount),
            inboundsCount: Number(entity.inboundsCount),
        };
        this.inbounds = entity.inbounds;

        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}
