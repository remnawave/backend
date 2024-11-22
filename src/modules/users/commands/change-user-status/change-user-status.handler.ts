import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Logger } from '@nestjs/common';
import { ICommandResponse } from '@common/types/command-response.type';

import { Transactional } from '@nestjs-cls/transactional';
import { ChangeUserStatusCommand } from './change-user-status.command';
import { ERRORS } from '@contract/constants';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(ChangeUserStatusCommand)
export class ChangeUserStatusHandler
    implements ICommandHandler<ChangeUserStatusCommand, ICommandResponse<void>>
{
    public readonly logger = new Logger(ChangeUserStatusHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    @Transactional()
    async execute(command: ChangeUserStatusCommand): Promise<ICommandResponse<void>> {
        try {
            await this.usersRepository.changeUserStatus(command.userUuid, command.status);

            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return {
                isOk: false,
                ...ERRORS.UPDATE_USER_ERROR,
            };
        }
    }
}