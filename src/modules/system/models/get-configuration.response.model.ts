interface INotificationsConfig {
    webhook: boolean;
    bandwidthUsage: number[] | null;
    notConnectedAfter: number[] | null;
    expirationNotifications: number[] | null;
}

interface IServiceConfig {
    cleanUsageHistory: boolean;
    disableUserUsageRecords: boolean;
    disableSrhRecords: boolean;
    exportToRedisStream: boolean;
}

interface IMiscConfig {
    shortUuidLength: number;
    userUsageIgnoreBelowBytes: number;
    subPublicDomain: string;
}

export interface IGetConfigurationResponse {
    notifications: INotificationsConfig;
    service: IServiceConfig;
    misc: IMiscConfig;
}

export class GetConfigurationResponseModel implements IGetConfigurationResponse {
    notifications: INotificationsConfig;
    service: IServiceConfig;
    misc: IMiscConfig;

    constructor(data: IGetConfigurationResponse) {
        this.notifications = data.notifications;
        this.service = data.service;
        this.misc = data.misc;
    }
}
