import type { InternalSquadsModel as InternalSquads } from '@generated/prisma/models';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

export class InternalSquadWithInfoEntity implements InternalSquads {
    public uuid: string;
    public viewPosition: number;
    public name: string;

    public membersCount: number | string | bigint | null;
    public inboundsCount: number | string | bigint | null;

    public inbounds: ConfigProfileInboundEntity[];

    public createdAt: Date;
    public updatedAt: Date;

    constructor(internalSquad: Partial<InternalSquadWithInfoEntity>) {
        Object.assign(this, internalSquad);

        this.membersCount = Number(this.membersCount) || 0;
        this.inboundsCount = Number(this.inboundsCount) || 0;

        return this;
    }
}
