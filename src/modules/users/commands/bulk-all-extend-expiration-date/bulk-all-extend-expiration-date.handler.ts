import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { BulkAllExtendExpirationDateCommand } from './bulk-all-extend-expiration-date.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BulkAllExtendExpirationDateCommand)
export class BulkAllExtendExpirationDateHandler implements ICommandHandler<BulkAllExtendExpirationDateCommand> {
    public readonly logger = new Logger(BulkAllExtendExpirationDateHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: BulkAllExtendExpirationDateCommand) {
        try {
            await this.usersRepository.bulkAllExtendExpirationDate(command.extendDays);

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
