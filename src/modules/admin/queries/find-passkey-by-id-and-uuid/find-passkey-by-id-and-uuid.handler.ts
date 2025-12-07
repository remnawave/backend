import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';
import { PasskeyEntity } from '@modules/admin/entities/passkey.entity';

import { FindPasskeyByIdAndAdminUuidQuery } from './find-passkey-by-id-and-uuid.query';

@QueryHandler(FindPasskeyByIdAndAdminUuidQuery)
export class FindPasskeyByIdAndAdminUuidHandler implements IQueryHandler<
    FindPasskeyByIdAndAdminUuidQuery,
    TResult<PasskeyEntity>
> {
    private readonly logger = new Logger(FindPasskeyByIdAndAdminUuidHandler.name);
    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(query: FindPasskeyByIdAndAdminUuidQuery): Promise<TResult<PasskeyEntity>> {
        try {
            const passkey = await this.passkeyRepository.findFirstByCriteria({
                id: query.id,
                adminUuid: query.adminUuid,
            });

            if (!passkey) {
                return fail(ERRORS.PASSKEY_NOT_FOUND);
            }

            return ok(passkey);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
