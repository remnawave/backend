import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetAdminByUsernameQuery } from './get-admin-by-username.query';
import { AdminRepository } from '../../repositories/admin.repository';
import { AdminEntity } from '../../entities/admin.entity';

@QueryHandler(GetAdminByUsernameQuery)
export class GetAdminByUsernameHandler implements IQueryHandler<
    GetAdminByUsernameQuery,
    TResult<AdminEntity>
> {
    private readonly logger = new Logger(GetAdminByUsernameHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: GetAdminByUsernameQuery): Promise<TResult<AdminEntity>> {
        try {
            const admin = await this.adminRepository.findFirstByCriteria({
                username: query.username,
                role: query.role,
            });

            if (!admin) {
                return fail(ERRORS.ADMIN_NOT_FOUND);
            }
            return ok(admin);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
