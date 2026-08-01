export interface ISubscriptionRequest {
    userId: bigint;
    userAgent: string;
    matchedResponseType: string;
    matchedRuleName?: string;
    requestIp?: string;
}
