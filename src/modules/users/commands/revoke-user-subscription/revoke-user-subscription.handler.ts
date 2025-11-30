import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { UsersService } from '@modules/users/users.service';

import { RevokeUserSubscriptionCommand } from './revoke-user-subscription.command';

@CommandHandler(RevokeUserSubscriptionCommand)
export class RevokeUserSubscriptionHandler implements ICommandHandler<
    RevokeUserSubscriptionCommand,
    ICommandResponse<boolean>
> {
    public readonly logger = new Logger(RevokeUserSubscriptionHandler.name);

    constructor(private readonly usersService: UsersService) {}

    async execute(command: RevokeUserSubscriptionCommand): Promise<ICommandResponse<boolean>> {
        try {
            const result = await this.usersService.revokeUserSubscription(command.uuid);

            if (!result.isOk) {
                return {
                    isOk: false,
                    response: false,
                };
            }

            return {
                isOk: true,
                response: true,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_USER_ERROR,
            };
        }
    }
}
