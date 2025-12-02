import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { SubscriptionTemplateEntity } from '../../entities/subscription-template.entity';

export class GetSubscriptionTemplateByUuidQuery extends Query<
    ICommandResponse<SubscriptionTemplateEntity>
> {
    constructor(public readonly uuid: string) {
        super();
    }
}
