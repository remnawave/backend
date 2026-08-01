export interface IAddUserSubscriptionRequestHistoryPayload {
    userId: string;
    requestAt: Date;
    srrResponseType: string;
    srrRuleName?: string;
    requestIp?: string;
    userAgent?: string;
}
