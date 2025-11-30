import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { AdminEntity } from '@modules/admin/entities/admin.entity';

import { AdminRepository } from '../../repositories/admin.repository';
import { CreateAdminCommand } from './create-admin.command';

@CommandHandler(CreateAdminCommand)
export class CreateAdminHandler implements ICommandHandler<
    CreateAdminCommand,
    ICommandResponse<AdminEntity>
> {
    public readonly logger = new Logger(CreateAdminHandler.name);

    constructor(private readonly adminRepository: AdminRepository) {}

    @Transactional()
    async execute(command: CreateAdminCommand): Promise<ICommandResponse<AdminEntity>> {
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
