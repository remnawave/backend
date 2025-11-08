import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { SubscriptionService } from '@modules/subscription/subscription.service';

import { GetUsersSubscriptionUrlQuery } from './get-users-subscription-url.query';

@QueryHandler(GetUsersSubscriptionUrlQuery)
export class GetUsersSubscriptionUrlHandler
    implements IQueryHandler<GetUsersSubscriptionUrlQuery, ICommandResponse<Record<string, string>>>
{
    constructor(private readonly subscriptionService: SubscriptionService) {}

    async execute(
        query: GetUsersSubscriptionUrlQuery,
    ): Promise<ICommandResponse<Record<string, string>>> {
        return this.subscriptionService.getUsersSubscriptionUrl(query.users);
    }
}
