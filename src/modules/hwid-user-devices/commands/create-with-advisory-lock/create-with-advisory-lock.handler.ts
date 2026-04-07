import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';

import { HwidUserDevicesRepository } from '../../repositories/hwid-user-devices.repository';
import { CreateWithAdvisoryLockCommand } from './create-with-advisory-lock.command';

@CommandHandler(CreateWithAdvisoryLockCommand)
export class CreateWithAdvisoryLockHandler implements ICommandHandler<CreateWithAdvisoryLockCommand> {
    public readonly logger = new Logger(CreateWithAdvisoryLockHandler.name);

    constructor(private readonly hwidUserDevicesRepository: HwidUserDevicesRepository) {}

    async execute(command: CreateWithAdvisoryLockCommand) {
        try {
            const result = await this.hwidUserDevicesRepository.createWithAdvisoryLock(
                command.hwidUserDevice,
                command.deviceLimit,
            );

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_HWID_USER_DEVICE_ERROR);
        }
    }
}
