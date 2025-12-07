import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { AdminRepository } from '../../repositories/admin.repository';
import { GetFirstAdminQuery } from './get-first-admin.query';
import { AdminEntity } from '../../entities/admin.entity';

@QueryHandler(GetFirstAdminQuery)
export class GetFirstAdminHandler implements IQueryHandler<
    GetFirstAdminQuery,
    TResult<AdminEntity>
> {
    private readonly logger = new Logger(GetFirstAdminHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: GetFirstAdminQuery): Promise<TResult<AdminEntity>> {
        try {
            const admin = await this.adminRepository.findFirstByCriteria({
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
