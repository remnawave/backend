import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';
import { PasskeyEntity } from '@modules/admin/entities/passkey.entity';

import { GetPasskeysByAdminUuidQuery } from './get-passkeys-by-admin-uuid.query';

@QueryHandler(GetPasskeysByAdminUuidQuery)
export class GetPasskeysByAdminUuidHandler
    implements IQueryHandler<GetPasskeysByAdminUuidQuery, ICommandResponse<PasskeyEntity[]>>
{
    private readonly logger = new Logger(GetPasskeysByAdminUuidHandler.name);
    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(query: GetPasskeysByAdminUuidQuery): Promise<ICommandResponse<PasskeyEntity[]>> {
        try {
            const passkeys = await this.passkeyRepository.findByCriteria({
                adminUuid: query.adminUuid,
            });

            return {
                isOk: true,
                response: passkeys,
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
