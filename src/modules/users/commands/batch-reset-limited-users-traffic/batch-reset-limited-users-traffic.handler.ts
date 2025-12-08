import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';

import { BatchResetLimitedUsersTrafficCommand } from './batch-reset-limited-users-traffic.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BatchResetLimitedUsersTrafficCommand)
export class BatchResetLimitedUsersTrafficHandler implements ICommandHandler<BatchResetLimitedUsersTrafficCommand> {
    public readonly logger = new Logger(BatchResetLimitedUsersTrafficHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: BatchResetLimitedUsersTrafficCommand) {
        try {
            const result = await this.usersRepository.resetLimitedUserTraffic(command.strategy);

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_USER_ERROR);
        }
    }
}
