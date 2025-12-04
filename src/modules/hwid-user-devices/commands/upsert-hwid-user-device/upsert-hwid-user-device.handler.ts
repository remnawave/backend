import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';

import { HwidUserDevicesRepository } from '../../repositories/hwid-user-devices.repository';
import { UpsertHwidUserDeviceCommand } from './upsert-hwid-user-device.command';

@CommandHandler(UpsertHwidUserDeviceCommand)
export class UpsertHwidUserDeviceHandler implements ICommandHandler<UpsertHwidUserDeviceCommand> {
    public readonly logger = new Logger(UpsertHwidUserDeviceHandler.name);

    constructor(private readonly hwidUserDevicesRepository: HwidUserDevicesRepository) {}

    async execute(command: UpsertHwidUserDeviceCommand) {
        try {
            const result = await this.hwidUserDevicesRepository.upsert(command.hwidUserDevice);

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPSERT_HWID_USER_DEVICE_ERROR);
        }
    }
}
