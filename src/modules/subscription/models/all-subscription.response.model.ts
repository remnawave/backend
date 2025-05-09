import { SubscriptionRawResponse } from './subscription-raw.response.model';

export class AllSubscriptionsResponseModel {
    public readonly subscriptions: SubscriptionRawResponse[];
    public readonly total: number;

    constructor(data: AllSubscriptionsResponseModel) {
        this.total = data.total;
        this.subscriptions = data.subscriptions;
    }
}
