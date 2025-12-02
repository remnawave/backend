import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { UserSubscriptionRequestHistoryRepository } from '../../repositories/user-subscription-request-history.repository';
import { CountAndDeleteSubscriptionRequestHistoryCommand } from './count-and-delete-subscription-request-history.command';

@CommandHandler(CountAndDeleteSubscriptionRequestHistoryCommand)
export class CountAndDeleteSubscriptionRequestHistoryHandler implements ICommandHandler<
    CountAndDeleteSubscriptionRequestHistoryCommand,
    void
> {
    public readonly logger = new Logger(CountAndDeleteSubscriptionRequestHistoryHandler.name);

    constructor(
        private readonly userSubscriptionRequestHistoryRepository: UserSubscriptionRequestHistoryRepository,
    ) {}

    async execute(command: CountAndDeleteSubscriptionRequestHistoryCommand): Promise<void> {
        try {
            const { userUuid } = command;

            await this.userSubscriptionRequestHistoryRepository.cleanupUserRecords(userUuid, 24);

            return;
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return;
        }
    }
}
