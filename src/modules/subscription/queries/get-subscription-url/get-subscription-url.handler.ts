import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { SubscriptionService } from '@modules/subscription/subscription.service';

import { GetSubscriptionUrlQuery } from './get-subscription-url.query';

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
