import { ERRORS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { UpdateExceededTrafficUsersCommand } from './update-exceeded-users.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(UpdateExceededTrafficUsersCommand)
export class UpdateExceededTrafficUsersHandler implements ICommandHandler<
    UpdateExceededTrafficUsersCommand,
    ICommandResponse<{ tId: bigint }[]>
> {
    public readonly logger = new Logger(UpdateExceededTrafficUsersHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    @Transactional<TransactionalAdapterPrisma>({
        maxWait: 20_000,
        timeout: 120_000,
    })
    async execute(): Promise<ICommandResponse<{ tId: bigint }[]>> {
        try {
            const result = await this.usersRepository.updateExceededTrafficUsers();

            return {
                isOk: true,
                response: result,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_EXCEEDED_TRAFFIC_USERS_ERROR,
            };
        }
    }
}
