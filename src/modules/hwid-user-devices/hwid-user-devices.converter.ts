import type { HwidUserDevicesModel as HwidUserDevices } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { HwidUserDeviceEntity } from './entities/hwid-user-device.entity';

const modelToEntity = (model: HwidUserDevices): HwidUserDeviceEntity => {
    return new HwidUserDeviceEntity(model);
};

const entityToModel = (entity: HwidUserDeviceEntity): HwidUserDevices => {
    return {
        hwid: entity.hwid,
        userUuid: entity.userUuid,

        platform: entity.platform,
        osVersion: entity.osVersion,
        deviceModel: entity.deviceModel,
        userAgent: entity.userAgent,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class HwidUserDevicesConverter extends UniversalConverter<
    HwidUserDeviceEntity,
    HwidUserDevices
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
