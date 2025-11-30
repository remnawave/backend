import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { AdminRepository } from '../../repositories/admin.repository';
import { GetFirstAdminQuery } from './get-first-admin.query';
import { AdminEntity } from '../../entities/admin.entity';

@QueryHandler(GetFirstAdminQuery)
export class GetFirstAdminHandler implements IQueryHandler<
    GetFirstAdminQuery,
    ICommandResponse<AdminEntity>
> {
    private readonly logger = new Logger(GetFirstAdminHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: GetFirstAdminQuery): Promise<ICommandResponse<AdminEntity>> {
        try {
            const admin = await this.adminRepository.findFirstByCriteria({
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
