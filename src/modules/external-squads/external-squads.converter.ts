import type { ExternalSquadsModel as ExternalSquads } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { ExternalSquadEntity } from './entities/external-squad.entity';

const modelToEntity = (model: ExternalSquads): ExternalSquadEntity => {
    return new ExternalSquadEntity(model);
};

const entityToModel = (entity: ExternalSquadEntity): ExternalSquads => {
    return {
        uuid: entity.uuid,
        viewPosition: entity.viewPosition,
        name: entity.name,
        subscriptionSettings: entity.subscriptionSettings,
        hostOverrides: entity.hostOverrides,
        responseHeaders: entity.responseHeaders,
        hwidSettings: entity.hwidSettings,
        customRemarks: entity.customRemarks,
        subpageConfigUuid: entity.subpageConfigUuid,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class ExternalSquadConverter extends UniversalConverter<
    ExternalSquadEntity,
    ExternalSquads
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
