import { ExternalSquads } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { ExternalSquadEntity } from './entities/external-squad.entity';

const modelToEntity = (model: ExternalSquads): ExternalSquadEntity => {
    return new ExternalSquadEntity(model);
};

const entityToModel = (entity: ExternalSquadEntity): ExternalSquads => {
    return {
        uuid: entity.uuid,
        name: entity.name,
        subscriptionSettings: entity.subscriptionSettings,
        hostOverrides: entity.hostOverrides,
        responseHeaders: entity.responseHeaders,
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
