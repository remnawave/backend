import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { GetAdminByUsernameQuery } from './get-admin-by-username.query';
import { AdminRepository } from '../../repositories/admin.repository';
import { AdminEntity } from '../../entities/admin.entity';

@QueryHandler(GetAdminByUsernameQuery)
export class GetAdminByUsernameHandler implements IQueryHandler<
    GetAdminByUsernameQuery,
    ICommandResponse<AdminEntity>
> {
    private readonly logger = new Logger(GetAdminByUsernameHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: GetAdminByUsernameQuery): Promise<ICommandResponse<AdminEntity>> {
        try {
            const admin = await this.adminRepository.findFirstByCriteria({
                username: query.username,
                role: query.role,
            });

            if (!admin) {
                return {
                    isOk: false,
                    ...ERRORS.ADMIN_NOT_FOUND,
                };
            }
            return {
                isOk: true,
                response: admin,
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
