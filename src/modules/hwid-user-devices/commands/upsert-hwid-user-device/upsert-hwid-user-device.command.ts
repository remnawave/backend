import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { HwidUserDeviceEntity } from '../../entities/hwid-user-device.entity';

export class UpsertHwidUserDeviceCommand extends Command<TResult<HwidUserDeviceEntity>> {
    constructor(public readonly hwidUserDevice: HwidUserDeviceEntity) {
        super();
    }
}
