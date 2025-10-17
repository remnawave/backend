import { SubscriptionSettings } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { SubscriptionSettingsEntity } from './entities/subscription-settings.entity';

const modelToEntity = (model: SubscriptionSettings): SubscriptionSettingsEntity => {
    return new SubscriptionSettingsEntity(model);
};

const entityToModel = (entity: SubscriptionSettingsEntity): SubscriptionSettings => {
    return {
        uuid: entity.uuid,
        profileTitle: entity.profileTitle,
        supportLink: entity.supportLink,
        profileUpdateInterval: entity.profileUpdateInterval,
        isProfileWebpageUrlEnabled: entity.isProfileWebpageUrlEnabled,
        serveJsonAtBaseSubscription: entity.serveJsonAtBaseSubscription,
        addUsernameToBaseSubscription: entity.addUsernameToBaseSubscription,
        isShowCustomRemarks: entity.isShowCustomRemarks,

        happAnnounce: entity.happAnnounce,
        happRouting: entity.happRouting,

        expiredUsersRemarks: entity.expiredUsersRemarks,
        limitedUsersRemarks: entity.limitedUsersRemarks,
        disabledUsersRemarks: entity.disabledUsersRemarks,

        customResponseHeaders: entity.customResponseHeaders,

        randomizeHosts: entity.randomizeHosts,

        responseRules: entity.responseRules,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class SubscriptionSettingsConverter extends UniversalConverter<
    SubscriptionSettingsEntity,
    SubscriptionSettings
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
