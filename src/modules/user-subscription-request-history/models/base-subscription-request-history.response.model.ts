import { UserSubscriptionRequestHistoryEntity } from '../entities';

export class BaseSubscriptionRequestHistoryResponseModel {
    public readonly id: number;
    public readonly userId: number;
    public readonly requestAt: Date;
    public readonly requestIp: string | null;
    public readonly userAgent: string | null;

    constructor(data: UserSubscriptionRequestHistoryEntity) {
        this.id = Number(data.id);
        this.userId = Number(data.userId);

        this.requestAt = data.requestAt;
        this.requestIp = data.requestIp;
        this.userAgent = data.userAgent;
    }
}
