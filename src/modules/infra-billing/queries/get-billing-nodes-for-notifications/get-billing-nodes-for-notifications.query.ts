import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { InfraBillingNodeNotificationEntity } from '@modules/infra-billing/entities';

export class GetBillingNodesForNotificationsQuery extends Query<
    TResult<InfraBillingNodeNotificationEntity[]>
> {
    constructor() {
        super();
    }
}
