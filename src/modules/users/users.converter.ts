import { Users } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { UserEntity } from './entities/users.entity';

const modelToEntity = (model: Users): UserEntity => {
    return new UserEntity(model);
};

const entityToModel = (entity: UserEntity): UserEntity => {
    return {
        uuid: entity.uuid,
        subscriptionUuid: entity.subscriptionUuid,
        shortUuid: entity.shortUuid,
        username: entity.username,
        status: entity.status,
        usedTrafficBytes: entity.usedTrafficBytes,
        lifetimeUsedTrafficBytes: entity.lifetimeUsedTrafficBytes,
        trafficLimitBytes: entity.trafficLimitBytes,
        trafficLimitStrategy: entity.trafficLimitStrategy,
        subLastUserAgent: entity.subLastUserAgent,
        subLastOpenedAt: entity.subLastOpenedAt,

        onlineAt: entity.onlineAt,
        expireAt: entity.expireAt,
        subRevokedAt: entity.subRevokedAt,
        lastTrafficResetAt: entity.lastTrafficResetAt,

        trojanPassword: entity.trojanPassword,
        vlessUuid: entity.vlessUuid,
        ssPassword: entity.ssPassword,

        description: entity.description,
        tag: entity.tag,

        telegramId: entity.telegramId,
        email: entity.email,

        hwidDeviceLimit: entity.hwidDeviceLimit,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};
@Injectable()
export class UserConverter extends UniversalConverter<UserEntity, Users> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
