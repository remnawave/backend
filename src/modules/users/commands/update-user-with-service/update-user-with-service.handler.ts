import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { UsersService } from '@modules/users/users.service';

import { UpdateUserWithServiceCommand } from './update-user-with-service.command';

@CommandHandler(UpdateUserWithServiceCommand)
export class UpdateUserWithServiceHandler implements ICommandHandler<UpdateUserWithServiceCommand> {
    public readonly logger = new Logger(UpdateUserWithServiceHandler.name);

    constructor(private readonly usersService: UsersService) {}

    async execute(command: UpdateUserWithServiceCommand) {
        try {
            await this.usersService.updateUser({
                ...command.dto,
            });

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
