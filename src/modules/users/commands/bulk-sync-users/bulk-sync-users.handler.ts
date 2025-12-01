import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { UsersRepository } from '../../repositories/users.repository';
import { BulkSyncUsersCommand } from './bulk-sync-users.command';

@CommandHandler(BulkSyncUsersCommand)
export class BulkSyncUsersHandler implements ICommandHandler<BulkSyncUsersCommand> {
    public readonly logger = new Logger(BulkSyncUsersHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: BulkSyncUsersCommand) {
        try {
            if (command.type === 'limited') {
                await this.usersRepository.bulkSyncLimitedUsers();
            } else if (command.type === 'expired') {
                await this.usersRepository.bulkSyncExpiredUsers();
            }

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
