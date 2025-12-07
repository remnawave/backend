import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { UserSubscriptionRequestHistoryRepository } from '@modules/user-subscription-request-history/repositories/user-subscription-request-history.repository';

import { GetUserSubscriptionRequestHistoryQuery } from './get-user-subscription-request-history.query';

@QueryHandler(GetUserSubscriptionRequestHistoryQuery)
export class GetUserSubscriptionRequestHistoryHandler implements IQueryHandler<GetUserSubscriptionRequestHistoryQuery> {
    private readonly logger = new Logger(GetUserSubscriptionRequestHistoryHandler.name);
    constructor(
        private readonly userSubscriptionRequestHistoryRepository: UserSubscriptionRequestHistoryRepository,
    ) {}

    async execute(query: GetUserSubscriptionRequestHistoryQuery) {
        try {
            const result = await this.userSubscriptionRequestHistoryRepository.findByUserUuid(
                query.userUuid,
            );

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
