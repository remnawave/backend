interface IUserSubscriptionRequestHistoryRecord {
    id: number;
    userId: number;
    requestAt: Date;
    requestIp: string | null;
    userAgent: string | null;
}
export class GetUserSubscriptionRequestHistoryResponseModel {
    public readonly total: number;
    public readonly records: IUserSubscriptionRequestHistoryRecord[];

    constructor(data: IUserSubscriptionRequestHistoryRecord[]) {
        this.records = data;
        this.total = data.length;
    }
}
