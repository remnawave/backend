import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { UserSubscriptionRequestHistoryEntity } from '@modules/user-subscription-request-history/entities';

export class GetUserSubscriptionRequestHistoryQuery extends Query<
    TResult<UserSubscriptionRequestHistoryEntity[]>
> {
    constructor(public readonly userId: bigint) {
        super();
    }
}
