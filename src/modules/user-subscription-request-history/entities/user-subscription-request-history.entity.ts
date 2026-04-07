import { UserSubscriptionRequestHistory } from '@prisma/client';

export class UserSubscriptionRequestHistoryEntity implements UserSubscriptionRequestHistory {
    id: bigint;
    userId: bigint;
    requestIp: string | null;
    userAgent: string | null;
    requestAt: Date;

    constructor(history: Partial<UserSubscriptionRequestHistory>) {
        Object.assign(this, history);
        return this;
    }
}
