import { HwidUserDevices } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { HwidUserDeviceEntity } from './entities/hwid-user-device.entity';

const modelToEntity = (model: HwidUserDevices): HwidUserDeviceEntity => {
    return new HwidUserDeviceEntity(model);
};

const entityToModel = (entity: HwidUserDeviceEntity): HwidUserDevices => {
    return {
        hwid: entity.hwid,
        userId: entity.userId,
        platform: entity.platform,
        osVersion: entity.osVersion,
        deviceModel: entity.deviceModel,
        userAgent: entity.userAgent,
        requestIp: entity.requestIp,

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
