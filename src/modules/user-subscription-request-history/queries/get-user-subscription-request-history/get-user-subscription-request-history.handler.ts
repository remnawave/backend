import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { UserSubscriptionRequestHistoryRepository } from '@modules/user-subscription-request-history/repositories/user-subscription-request-history.repository';
import { UserSubscriptionRequestHistoryEntity } from '@modules/user-subscription-request-history/entities';

import { GetUserSubscriptionRequestHistoryQuery } from './get-user-subscription-request-history.query';

@QueryHandler(GetUserSubscriptionRequestHistoryQuery)
export class GetUserSubscriptionRequestHistoryHandler implements IQueryHandler<
    GetUserSubscriptionRequestHistoryQuery,
    ICommandResponse<UserSubscriptionRequestHistoryEntity[]>
> {
    private readonly logger = new Logger(GetUserSubscriptionRequestHistoryHandler.name);
    constructor(
        private readonly userSubscriptionRequestHistoryRepository: UserSubscriptionRequestHistoryRepository,
    ) {}

    async execute(
        query: GetUserSubscriptionRequestHistoryQuery,
    ): Promise<ICommandResponse<UserSubscriptionRequestHistoryEntity[]>> {
        try {
            const result = await this.userSubscriptionRequestHistoryRepository.findByUserUuid(
                query.userUuid,
            );

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
