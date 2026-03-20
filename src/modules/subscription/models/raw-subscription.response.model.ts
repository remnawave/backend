import { ResolvedProxyConfig } from '@modules/subscription-template/resolve-proxy/interfaces';
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
    public resolvedProxyConfigs: ResolvedProxyConfig[];
    public headers: ISubscriptionHeaders;

    constructor(data: RawSubscriptionWithHostsResponse) {
        this.user = data.user;
        this.convertedUserInfo = data.convertedUserInfo;
        this.resolvedProxyConfigs = data.resolvedProxyConfigs;
        this.headers = data.headers;
    }
}
