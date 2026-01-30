import type { ConfigProfileInboundsModel as ConfigProfileInbounds } from '@generated/prisma/models';

export class ConfigProfileInboundEntity implements ConfigProfileInbounds {
    public uuid: string;
    public profileUuid: string;

    public tag: string;
    public type: string;
    public network: string | null;
    public security: string | null;
    public port: number | null;

    public rawInbound: object | null;

    constructor(configProfileInbound: Partial<ConfigProfileInbounds>) {
        Object.assign(this, configProfileInbound);
        return this;
    }
}
