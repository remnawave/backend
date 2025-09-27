import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { GetSubscriptionUrlQuery } from './get-subscription-url.query';
import { SubscriptionService } from '@modules/subscription/subscription.service';

@QueryHandler(GetSubscriptionUrlQuery)
export class GetSubscriptionUrlHandler
    implements IQueryHandler<GetSubscriptionUrlQuery, ICommandResponse<string>>
{
    constructor(private readonly subscriptionService: SubscriptionService) {}

    async execute(query: GetSubscriptionUrlQuery): Promise<ICommandResponse<string>> {
        return this.subscriptionService.getUserSubscriptionLinkByUser(
            query.userShortUuid,
            query.username,
        );
    }
}
