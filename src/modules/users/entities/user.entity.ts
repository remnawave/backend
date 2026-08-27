import { InternalSquadEntity } from '@modules/internal-squads/entities';

import { BaseUserEntity } from './base-users.entity';
import { UserTrafficEntity } from './user-traffic.entity';

interface IActiveInternalSquads {
    activeInternalSquads?: Omit<
        InternalSquadEntity,
        'createdAt' | 'tags' | 'updatedAt' | 'viewPosition'
    >[];
}

export class UserEntity extends BaseUserEntity {
    public readonly activeInternalSquads: Omit<
        InternalSquadEntity,
        'createdAt' | 'tags' | 'updatedAt' | 'viewPosition'
    >[];
    public readonly userTraffic: Omit<UserTrafficEntity, 'id'>;

    constructor(user: BaseUserEntity & IActiveInternalSquads & UserTrafficEntity) {
        super(user);

        Object.assign(this, user);

        this.userTraffic = new UserTrafficEntity({
            usedTrafficBytes: user.usedTrafficBytes,
            lifetimeUsedTrafficBytes: user.lifetimeUsedTrafficBytes,
            firstConnectedAt: user.firstConnectedAt,
            onlineAt: user.onlineAt,
            lastConnectedNodeUuid: user.lastConnectedNodeUuid,
        });

        this.activeInternalSquads = user.activeInternalSquads ?? [];

        return this;
    }
}
