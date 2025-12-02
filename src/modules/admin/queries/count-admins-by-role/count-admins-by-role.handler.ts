import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { AdminRepository } from '../../repositories/admin.repository';
import { CountAdminsByRoleQuery } from './count-admins-by-role.query';

@QueryHandler(CountAdminsByRoleQuery)
export class CountAdminsByRoleHandler implements IQueryHandler<
    CountAdminsByRoleQuery,
    ICommandResponse<number>
> {
    private readonly logger = new Logger(CountAdminsByRoleHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: CountAdminsByRoleQuery): Promise<ICommandResponse<number>> {
        try {
            const count = await this.adminRepository.countByCriteria({
                role: query.role,
            });

            return {
                isOk: true,
                response: count,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
