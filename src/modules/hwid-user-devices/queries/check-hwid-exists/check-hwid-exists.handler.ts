import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { HwidUserDevicesRepository } from '../../repositories/hwid-user-devices.repository';
import { CheckHwidExistsQuery } from './check-hwid-exists.query';

@QueryHandler(CheckHwidExistsQuery)
export class CheckHwidExistsHandler implements IQueryHandler<CheckHwidExistsQuery> {
    private readonly logger = new Logger(CheckHwidExistsHandler.name);
    constructor(private readonly hwidUserDevicesRepository: HwidUserDevicesRepository) {}

    async execute(query: CheckHwidExistsQuery) {
        try {
            const result = await this.hwidUserDevicesRepository.checkHwidExists(
                query.hwid,
                query.userId,
            );

            return ok({ exists: result });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CHECK_HWID_EXISTS_ERROR);
        }
    }
}
