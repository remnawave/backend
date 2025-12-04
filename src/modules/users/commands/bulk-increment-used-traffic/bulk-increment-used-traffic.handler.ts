import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';

import { BulkIncrementUsedTrafficCommand } from './bulk-increment-used-traffic.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BulkIncrementUsedTrafficCommand)
export class BulkIncrementUsedTrafficHandler implements ICommandHandler<BulkIncrementUsedTrafficCommand> {
    public readonly logger = new Logger(BulkIncrementUsedTrafficHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: BulkIncrementUsedTrafficCommand) {
        try {
            const result = await this.usersRepository.bulkIncrementUsedTraffic(
                command.userUsageList,
            );

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_USER_ERROR);
        }
    }
}
