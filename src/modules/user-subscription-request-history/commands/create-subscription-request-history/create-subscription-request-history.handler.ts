import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';

import { UserSubscriptionRequestHistoryEntity } from '@modules/user-subscription-request-history';

import { UserSubscriptionRequestHistoryRepository } from '../../repositories/user-subscription-request-history.repository';
import { CreateSubscriptionRequestHistoryCommand } from './create-subscription-request-history.command';

@CommandHandler(CreateSubscriptionRequestHistoryCommand)
export class CreateSubscriptionRequestHistoryHandler implements ICommandHandler<
    CreateSubscriptionRequestHistoryCommand,
    TResult<{
        userSubscriptionRequestHistory: UserSubscriptionRequestHistoryEntity;
    }>
> {
    public readonly logger = new Logger(CreateSubscriptionRequestHistoryHandler.name);

    constructor(
        private readonly userSubscriptionRequestHistoryRepository: UserSubscriptionRequestHistoryRepository,
    ) {}

    async execute(command: CreateSubscriptionRequestHistoryCommand): Promise<
        TResult<{
            userSubscriptionRequestHistory: UserSubscriptionRequestHistoryEntity;
        }>
    > {
        try {
            const { userSubscriptionRequestHistory } = command;

            await this.userSubscriptionRequestHistoryRepository.create(
                userSubscriptionRequestHistory,
            );

            return {
                isOk: true,
                response: {
                    userSubscriptionRequestHistory,
                },
            };
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return {
                isOk: false,
                ...ERRORS.CREATE_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR,
            };
        }
    }
}
