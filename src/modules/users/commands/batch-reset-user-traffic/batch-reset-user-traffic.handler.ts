import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { BatchResetUserTrafficCommand } from './batch-reset-user-traffic.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BatchResetUserTrafficCommand)
export class BatchResetUserTrafficHandler implements ICommandHandler<BatchResetUserTrafficCommand> {
    public readonly logger = new Logger(BatchResetUserTrafficHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: BatchResetUserTrafficCommand) {
        try {
            await this.usersRepository.resetUserTraffic(command.strategy);

            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}
