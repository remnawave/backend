import type { UserTrafficModel as UserTraffic } from '@generated/prisma/models';

export class UserTrafficEntity implements UserTraffic {
    public tId: bigint;
    public usedTrafficBytes: bigint;
    public lifetimeUsedTrafficBytes: bigint;
    public firstConnectedAt: Date | null;
    public onlineAt: Date | null;
    public lastConnectedNodeUuid: string | null;

    constructor(traffic: Partial<UserTraffic>) {
        Object.assign(this, traffic);
        return this;
    }
}
