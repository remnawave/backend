import type { SubscriptionSettingsModel as SubscriptionSettings } from '@generated/prisma/models';

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
        isShowCustomRemarks: entity.isShowCustomRemarks,

        happAnnounce: entity.happAnnounce,
        happRouting: entity.happRouting,

        customRemarks: entity.customRemarks,

        customResponseHeaders: entity.customResponseHeaders,

        randomizeHosts: entity.randomizeHosts,

        responseRules: entity.responseRules,
        hwidSettings: entity.hwidSettings,
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
