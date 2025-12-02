import { Query } from '@nestjs/cqrs';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities';

export class GetCachedSubscriptionSettingsQuery extends Query<SubscriptionSettingsEntity | null> {
    constructor() {
        super();
    }
}
