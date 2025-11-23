export interface ICheckAndUpsertHwidDevicePayload {
    hwid: string;
    userUuid: string;
    platform: string | undefined;
    osVersion: string | undefined;
    deviceModel: string | undefined;
    userAgent: string | undefined;
}
