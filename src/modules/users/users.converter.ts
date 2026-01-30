import type { UsersModel as Users } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { BaseUserEntity } from './entities/base-users.entity';

const modelToEntity = (model: Users): BaseUserEntity => {
    return new BaseUserEntity(model);
};

const entityToModel = (entity: BaseUserEntity): Users => {
    return {
        tId: entity.tId,
        uuid: entity.uuid,
        shortUuid: entity.shortUuid,
        username: entity.username,
        status: entity.status,

        trafficLimitBytes: entity.trafficLimitBytes,
        trafficLimitStrategy: entity.trafficLimitStrategy,
        subLastUserAgent: entity.subLastUserAgent,
        subLastOpenedAt: entity.subLastOpenedAt,

        expireAt: entity.expireAt,
        subRevokedAt: entity.subRevokedAt,

        trojanPassword: entity.trojanPassword,
        vlessUuid: entity.vlessUuid,
        ssPassword: entity.ssPassword,

        description: entity.description,
        tag: entity.tag,

        telegramId: entity.telegramId,
        email: entity.email,

        hwidDeviceLimit: entity.hwidDeviceLimit,

        externalSquadUuid: entity.externalSquadUuid,

        lastTrafficResetAt: entity.lastTrafficResetAt,
        lastTriggeredThreshold: entity.lastTriggeredThreshold,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};
@Injectable()
export class UserConverter extends UniversalConverter<BaseUserEntity, Users> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
