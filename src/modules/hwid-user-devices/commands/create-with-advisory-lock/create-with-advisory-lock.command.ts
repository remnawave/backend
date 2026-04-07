import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { HwidUserDeviceEntity } from '../../entities/hwid-user-device.entity';

export class CreateWithAdvisoryLockCommand extends Command<
    TResult<{ created: boolean; hwidUserDevice: HwidUserDeviceEntity | null }>
> {
    constructor(
        public readonly hwidUserDevice: HwidUserDeviceEntity,
        public readonly deviceLimit: number,
        public readonly userId: bigint,
    ) {
        super();
    }
}
