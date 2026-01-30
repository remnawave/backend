import type { HwidUserDevicesModel as HwidUserDevices } from '@generated/prisma/models';

export class HwidUserDeviceEntity implements HwidUserDevices {
    public hwid: string;
    public userUuid: string;
    public platform: string | null;
    public osVersion: string | null;
    public deviceModel: string | null;
    public userAgent: string | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(hwidUserDevice: Partial<HwidUserDevices>) {
        Object.assign(this, hwidUserDevice);
        return this;
    }
}
