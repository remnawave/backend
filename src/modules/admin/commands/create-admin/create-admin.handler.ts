import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';

import { AdminEntity } from '@modules/admin/entities/admin.entity';

import { AdminRepository } from '../../repositories/admin.repository';
import { CreateAdminCommand } from './create-admin.command';

@CommandHandler(CreateAdminCommand)
export class CreateAdminHandler implements ICommandHandler<
    CreateAdminCommand,
    TResult<AdminEntity>
> {
    public readonly logger = new Logger(CreateAdminHandler.name);

    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(command: CreateAdminCommand): Promise<TResult<AdminEntity>> {
        try {
            const result = await this.adminRepository.create(
                new AdminEntity({
                    username: command.username,
                    passwordHash: command.password,
                    role: command.role,
                }),
            );

            return {
                isOk: true,
                response: result,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_ADMIN_ERROR,
            };
        }
    }
}
