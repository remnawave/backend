export interface ICheckAndUpsertHwidDevicePayload {
    hwid: string;
    userId: string;
    platform: string | undefined;
    osVersion: string | undefined;
    deviceModel: string | undefined;
    userAgent: string | undefined;
    requestIp: string | undefined;
}
