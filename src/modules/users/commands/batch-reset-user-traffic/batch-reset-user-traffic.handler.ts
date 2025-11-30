import { ERRORS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { BatchResetUserTrafficCommand } from './batch-reset-user-traffic.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BatchResetUserTrafficCommand)
export class BatchResetUserTrafficHandler implements ICommandHandler<
    BatchResetUserTrafficCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(BatchResetUserTrafficHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    @Transactional<TransactionalAdapterPrisma>({
        maxWait: 20_000,
        timeout: 120_000,
    })
    async execute(command: BatchResetUserTrafficCommand): Promise<ICommandResponse<void>> {
        try {
            await this.usersRepository.resetUserTraffic(command.strategy);

            return {
                isOk: true,
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
