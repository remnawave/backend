import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { UsersService } from '@modules/users/users.service';

import { RevokeUserSubscriptionCommand } from './revoke-user-subscription.command';

@CommandHandler(RevokeUserSubscriptionCommand)
export class RevokeUserSubscriptionHandler implements ICommandHandler<RevokeUserSubscriptionCommand> {
    public readonly logger = new Logger(RevokeUserSubscriptionHandler.name);

    constructor(private readonly usersService: UsersService) {}

    async execute(command: RevokeUserSubscriptionCommand) {
        try {
            await this.usersService.revokeUserSubscription(command.uuid);

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
