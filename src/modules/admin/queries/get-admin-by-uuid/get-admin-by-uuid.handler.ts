import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { AdminRepository } from '../../repositories/admin.repository';
import { GetAdminByUuidQuery } from './get-admin-by-uuid.query';
import { AdminEntity } from '../../entities/admin.entity';

@QueryHandler(GetAdminByUuidQuery)
export class GetAdminByUuidHandler implements IQueryHandler<
    GetAdminByUuidQuery,
    TResult<AdminEntity>
> {
    private readonly logger = new Logger(GetAdminByUuidHandler.name);
    constructor(private readonly adminRepository: AdminRepository) {}

    async execute(query: GetAdminByUuidQuery): Promise<TResult<AdminEntity>> {
        try {
            const admin = await this.adminRepository.findByUUID(query.uuid);

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
