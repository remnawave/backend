export interface IAddUserSubscriptionRequestHistoryPayload {
    userId: string;
    requestAt: Date;
    requestIp?: string;
    userAgent?: string;
}
