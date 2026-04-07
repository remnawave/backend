import { HwidUserDevices } from '@prisma/client';

export class HwidUserDeviceEntity implements HwidUserDevices {
    public hwid: string;
    public userId: bigint;
    public platform: string | null;
    public osVersion: string | null;
    public deviceModel: string | null;
    public userAgent: string | null;
    public requestIp: string | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(hwidUserDevice: Partial<HwidUserDevices>) {
        Object.assign(this, hwidUserDevice);
        return this;
    }
}
