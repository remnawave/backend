import { IRawHost } from '@modules/subscription-template/generators/interfaces';
import { GetFullUserResponseModel } from '@modules/users/models';

import { ISubscriptionHeaders } from '../interfaces';

export class RawSubscriptionWithHostsResponse {
    public user: GetFullUserResponseModel;
    public convertedUserInfo: {
        daysLeft: number;
        trafficLimit: string;
        trafficUsed: string;
        lifetimeTrafficUsed: string;
        isHwidLimited: boolean;
    };
    public rawHosts: IRawHost[];
    public headers: ISubscriptionHeaders;

    constructor(data: RawSubscriptionWithHostsResponse) {
        this.user = data.user;
        this.convertedUserInfo = data.convertedUserInfo;
        this.rawHosts = data.rawHosts;
        this.headers = data.headers;
    }
}
