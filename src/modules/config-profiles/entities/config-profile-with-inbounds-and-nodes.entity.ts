import { JsonArray, JsonObject } from '@prisma/client/runtime/library';
import { ConfigProfiles } from '@prisma/client';

import { ConfigProfileInboundEntity } from './config-profile-inbound.entity';

export class ConfigProfileWithInboundsAndNodesEntity implements ConfigProfiles {
    public uuid: string;
    public viewPosition: number;
    public name: string;
    public config: string | number | boolean | JsonObject | JsonArray | null | object;

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
