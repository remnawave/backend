import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { UserSubscriptionRequestHistoryEntity } from '@modules/user-subscription-request-history';

export class CreateSubscriptionRequestHistoryCommand extends Command<
    TResult<{
        userSubscriptionRequestHistory: UserSubscriptionRequestHistoryEntity;
    }>
> {
    constructor(
        public readonly userSubscriptionRequestHistory: UserSubscriptionRequestHistoryEntity,
    ) {
        super();
    }
}
