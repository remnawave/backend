import { ERRORS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { BulkDeleteByStatusCommand } from './bulk-delete-by-status.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(BulkDeleteByStatusCommand)
export class BulkDeleteByStatusHandler implements ICommandHandler<
    BulkDeleteByStatusCommand,
    ICommandResponse<{ deletedCount: number }>
> {
    public readonly logger = new Logger(BulkDeleteByStatusHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    @Transactional<TransactionalAdapterPrisma>({
        maxWait: 20_000,
        timeout: 120_000,
    })
    async execute(
        command: BulkDeleteByStatusCommand,
    ): Promise<ICommandResponse<{ deletedCount: number }>> {
        try {
            const result = await this.usersRepository.deleteManyByStatus(
                command.status,
                command.limit,
            );

            return {
                isOk: true,
                response: { deletedCount: result },
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_DELETE_BY_STATUS_ERROR,
            };
        }
    }
}
