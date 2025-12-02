import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { UsersService } from '@modules/users/users.service';

import { UpdateUserWithServiceCommand } from './update-user-with-service.command';

@CommandHandler(UpdateUserWithServiceCommand)
export class UpdateUserWithServiceHandler implements ICommandHandler<
    UpdateUserWithServiceCommand,
    ICommandResponse<boolean>
> {
    public readonly logger = new Logger(UpdateUserWithServiceHandler.name);

    constructor(private readonly usersService: UsersService) {}

    async execute(command: UpdateUserWithServiceCommand): Promise<ICommandResponse<boolean>> {
        try {
            const result = await this.usersService.updateUser({
                ...command.dto,
            });

            if (!result.isOk) {
                return {
                    isOk: false,
                    response: false,
                };
            }

            return {
                isOk: true,
                response: true,
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
