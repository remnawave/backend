import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { SubscriptionTemplateEntity } from '../../entities/subscription-template.entity';

export class GetSubscriptionTemplateByUuidQuery extends Query<TResult<SubscriptionTemplateEntity>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
