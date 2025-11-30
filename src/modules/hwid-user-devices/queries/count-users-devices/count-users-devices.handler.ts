import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { HwidUserDevicesRepository } from '../../repositories/hwid-user-devices.repository';
import { CountUsersDevicesQuery } from './count-users-devices.query';

@QueryHandler(CountUsersDevicesQuery)
export class CountUsersDevicesHandler implements IQueryHandler<
    CountUsersDevicesQuery,
    ICommandResponse<number>
> {
    private readonly logger = new Logger(CountUsersDevicesHandler.name);
    constructor(private readonly hwidUserDevicesRepository: HwidUserDevicesRepository) {}

    async execute(query: CountUsersDevicesQuery): Promise<ICommandResponse<number>> {
        try {
            const count = await this.hwidUserDevicesRepository.countByUserUuid(query.userUuid);

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
