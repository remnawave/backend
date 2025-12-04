import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';

import { UpdateExceededTrafficUsersCommand } from './update-exceeded-users.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(UpdateExceededTrafficUsersCommand)
export class UpdateExceededTrafficUsersHandler implements ICommandHandler<
    UpdateExceededTrafficUsersCommand,
    TResult<{ tId: bigint }[]>
> {
    public readonly logger = new Logger(UpdateExceededTrafficUsersHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(): Promise<TResult<{ tId: bigint }[]>> {
        try {
            const result = await this.usersRepository.updateExceededTrafficUsers();

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_EXCEEDED_TRAFFIC_USERS_ERROR);
        }
    }
}
