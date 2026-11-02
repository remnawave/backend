import { ConfigProfileInboundEntity } from './config-profile-inbound.entity';

export class ConfigProfileInboundWithSquadsEntity extends ConfigProfileInboundEntity {
    public activeSquads: string[];
    public onlineByNode: { nodeUuid: string; count: number }[] = [];

    constructor(
        configProfileInbound: {
            activeSquads: { uuid: string }[];
        } & Partial<ConfigProfileInboundEntity>,
    ) {
        super(configProfileInbound);
        this.activeSquads = configProfileInbound.activeSquads.map((squad) => squad.uuid);
        return this;
    }
}
