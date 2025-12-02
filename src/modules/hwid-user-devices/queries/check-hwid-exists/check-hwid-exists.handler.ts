import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { HwidUserDevicesRepository } from '../../repositories/hwid-user-devices.repository';
import { CheckHwidExistsQuery } from './check-hwid-exists.query';

@QueryHandler(CheckHwidExistsQuery)
export class CheckHwidExistsHandler implements IQueryHandler<
    CheckHwidExistsQuery,
    ICommandResponse<{ exists: boolean }>
> {
    private readonly logger = new Logger(CheckHwidExistsHandler.name);
    constructor(private readonly hwidUserDevicesRepository: HwidUserDevicesRepository) {}

    async execute(query: CheckHwidExistsQuery): Promise<ICommandResponse<{ exists: boolean }>> {
        try {
            const result = await this.hwidUserDevicesRepository.checkHwidExists(
                query.hwid,
                query.userUuid,
            );

            return {
                isOk: true,
                response: {
                    exists: result,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CHECK_HWID_EXISTS_ERROR,
            };
        }
    }
}
