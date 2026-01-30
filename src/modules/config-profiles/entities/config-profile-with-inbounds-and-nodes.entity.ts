import type { ConfigProfilesModel as ConfigProfiles } from '@generated/prisma/models';

import { ConfigProfileInboundEntity } from './config-profile-inbound.entity';

export class ConfigProfileWithInboundsAndNodesEntity implements ConfigProfiles {
    public uuid: string;
    public viewPosition: number;
    public name: string;
    public config: string | number | boolean | null | object;

    public inbounds: ConfigProfileInboundEntity[];
    public nodes: {
        uuid: string;
        name: string;
        countryCode: string;
    }[];

    public createdAt: Date;
    public updatedAt: Date;

    constructor(
        configProfileWithInboundsAndNodes: Partial<ConfigProfileWithInboundsAndNodesEntity>,
    ) {
        Object.assign(this, configProfileWithInboundsAndNodes);
        return this;
    }
}
