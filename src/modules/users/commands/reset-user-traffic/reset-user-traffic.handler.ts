import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { UsersService } from '@modules/users/users.service';

import { ResetUserTrafficCommand } from './reset-user-traffic.command';

@CommandHandler(ResetUserTrafficCommand)
export class ResetUserTrafficHandler implements ICommandHandler<ResetUserTrafficCommand> {
    public readonly logger = new Logger(ResetUserTrafficHandler.name);

    constructor(private readonly usersService: UsersService) {}

    async execute(command: ResetUserTrafficCommand) {
        try {
            await this.usersService.resetUserTraffic(command.uuid);

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
