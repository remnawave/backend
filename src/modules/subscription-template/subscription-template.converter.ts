import { SubscriptionTemplate } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { SubscriptionTemplateEntity } from './entities/subscription-template.entity';

const modelToEntity = (model: SubscriptionTemplate): SubscriptionTemplateEntity => {
    return new SubscriptionTemplateEntity(model);
};

const entityToModel = (entity: SubscriptionTemplateEntity): SubscriptionTemplate => {
    return {
        uuid: entity.uuid,
        name: entity.name,
        templateType: entity.templateType,
        templateYaml: entity.templateYaml,
        templateJson: entity.templateJson,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class SubscriptionTemplateConverter extends UniversalConverter<
    SubscriptionTemplateEntity,
    SubscriptionTemplate
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
