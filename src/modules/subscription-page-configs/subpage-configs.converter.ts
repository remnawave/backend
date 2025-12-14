import { SubscriptionPageConfig } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { SubscriptionPageConfigEntity } from './entities/sub-page-config.entity';

const modelToEntity = (model: SubscriptionPageConfig): SubscriptionPageConfigEntity => {
    return new SubscriptionPageConfigEntity(model);
};

const entityToModel = (entity: SubscriptionPageConfigEntity): SubscriptionPageConfig => {
    return {
        uuid: entity.uuid,
        viewPosition: entity.viewPosition,
        name: entity.name,
        config: entity.config,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class SubscriptionPageConfigConverter extends UniversalConverter<
    SubscriptionPageConfigEntity,
    SubscriptionPageConfig
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
