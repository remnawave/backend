export interface IAddUserSubscriptionRequestHistoryPayload {
    userUuid: string;
    requestAt: Date;
    requestIp?: string;
    userAgent?: string;
}
