import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { HwidUserDevicesRepository } from '../../repositories/hwid-user-devices.repository';
import { UpsertHwidUserDeviceCommand } from './upsert-hwid-user-device.command';
import { HwidUserDeviceEntity } from '../../entities/hwid-user-device.entity';

@CommandHandler(UpsertHwidUserDeviceCommand)
export class UpsertHwidUserDeviceHandler implements ICommandHandler<
    UpsertHwidUserDeviceCommand,
    ICommandResponse<HwidUserDeviceEntity>
> {
    public readonly logger = new Logger(UpsertHwidUserDeviceHandler.name);

    constructor(private readonly hwidUserDevicesRepository: HwidUserDevicesRepository) {}

    async execute(
        command: UpsertHwidUserDeviceCommand,
    ): Promise<ICommandResponse<HwidUserDeviceEntity>> {
        try {
            const result = await this.hwidUserDevicesRepository.upsert(command.hwidUserDevice);

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPSERT_HWID_USER_DEVICE_ERROR,
            };
        }
    }
}
