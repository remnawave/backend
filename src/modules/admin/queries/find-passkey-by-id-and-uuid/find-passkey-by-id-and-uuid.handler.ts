import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';
import { PasskeyEntity } from '@modules/admin/entities/passkey.entity';

import { FindPasskeyByIdAndAdminUuidQuery } from './find-passkey-by-id-and-uuid.query';

@QueryHandler(FindPasskeyByIdAndAdminUuidQuery)
export class FindPasskeyByIdAndAdminUuidHandler
    implements IQueryHandler<FindPasskeyByIdAndAdminUuidQuery, ICommandResponse<PasskeyEntity>>
{
    private readonly logger = new Logger(FindPasskeyByIdAndAdminUuidHandler.name);
    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(
        query: FindPasskeyByIdAndAdminUuidQuery,
    ): Promise<ICommandResponse<PasskeyEntity>> {
        try {
            const passkey = await this.passkeyRepository.findFirstByCriteria({
                id: query.id,
                adminUuid: query.adminUuid,
            });

            if (!passkey) {
                return {
                    isOk: false,
                    ...ERRORS.PASSKEY_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: passkey,
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
