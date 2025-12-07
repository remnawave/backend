import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { AdminRepository } from '../../repositories/admin.repository';
import { CountAdminsByRoleQuery } from './count-admins-by-role.query';

@QueryHandler(CountAdminsByRoleQuery)
export class CountAdminsByRoleHandler implements IQueryHandler<
    CountAdminsByRoleQuery,
    TResult<number>
> {
    private readonly logger = new Logger(CountAdminsByRoleHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: CountAdminsByRoleQuery): Promise<TResult<number>> {
        try {
            const count = await this.adminRepository.countByCriteria({
                role: query.role,
            });

            return ok(count);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
