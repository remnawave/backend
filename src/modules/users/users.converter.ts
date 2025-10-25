import { Users } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { BaseUserEntity } from './entities/base-users.entity';

const modelToEntity = (model: Users): BaseUserEntity => {
    return new BaseUserEntity(model);
};

const entityToModel = (entity: BaseUserEntity): BaseUserEntity => {
    return {
        uuid: entity.uuid,
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
        lastConnectedNodeUuid: entity.lastConnectedNodeUuid,

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

        firstConnectedAt: entity.firstConnectedAt,
        lastTriggeredThreshold: entity.lastTriggeredThreshold,

        externalSquadUuid: entity.externalSquadUuid,

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
