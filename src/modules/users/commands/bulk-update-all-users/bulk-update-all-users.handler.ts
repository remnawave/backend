import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { BulkUpdateAllUsersCommand } from './bulk-update-all-users.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BulkUpdateAllUsersCommand)
export class BulkUpdateAllUsersHandler implements ICommandHandler<BulkUpdateAllUsersCommand> {
    public readonly logger = new Logger(BulkUpdateAllUsersHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: BulkUpdateAllUsersCommand) {
        try {
            await this.usersRepository.bulkUpdateAllUsersByRange({
                fields: command.fields,
            });

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
