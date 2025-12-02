import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { UpdateExpiredUsersCommand } from './update-expired-users.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(UpdateExpiredUsersCommand)
export class UpdateExpiredUsersHandler implements ICommandHandler<
    UpdateExpiredUsersCommand,
    ICommandResponse<{ tId: bigint }[]>
> {
    public readonly logger = new Logger(UpdateExpiredUsersHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(): Promise<ICommandResponse<{ tId: bigint }[]>> {
        try {
            const result = await this.usersRepository.updateExpiredUsers();

            return {
                isOk: true,
                response: result,
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
