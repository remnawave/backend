import { HwidUserDeviceEntity } from '../entities/hwid-user-device.entity';

export class BaseUserHwidDevicesResponseModel {
    public readonly hwid: string;
    public readonly userId: number;

    public readonly platform: string | null;
    public readonly osVersion: string | null;
    public readonly deviceModel: string | null;
    public readonly userAgent: string | null;
    public readonly requestIp: string | null;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(data: HwidUserDeviceEntity) {
        this.hwid = data.hwid;
        this.userId = Number(data.userId);

        this.platform = data.platform;
        this.osVersion = data.osVersion;
        this.deviceModel = data.deviceModel;
        this.userAgent = data.userAgent;
        this.requestIp = data.requestIp;

        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
    }
}
