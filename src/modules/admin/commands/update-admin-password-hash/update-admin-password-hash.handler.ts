import { ERRORS } from '@contract/constants';

import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { fail, TResult, ok } from '@common/types';

import { AdminEntity } from '@modules/admin/entities/admin.entity';

import { AdminRepository } from '../../repositories/admin.repository';
import { UpdateAdminPasswordHashCommand } from './update-admin-password-hash.command';

@CommandHandler(UpdateAdminPasswordHashCommand)
export class UpdateAdminPasswordHashHandler implements ICommandHandler<
    UpdateAdminPasswordHashCommand,
    TResult<AdminEntity>
> {
    public readonly logger = new Logger(UpdateAdminPasswordHashHandler.name);

    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(command: UpdateAdminPasswordHashCommand): Promise<TResult<AdminEntity>> {
        try {
            const result = await this.adminRepository.update({
                uuid: command.uuid,
                passwordHash: command.passwordHash,
            });

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
