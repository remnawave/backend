import type { InternalSquadsModel as InternalSquads } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { InternalSquadEntity } from './entities/internal-squad.entity';

const modelToEntity = (model: InternalSquads): InternalSquadEntity => {
    return new InternalSquadEntity(model);
};

const entityToModel = (entity: InternalSquadEntity): InternalSquads => {
    return {
        uuid: entity.uuid,
        viewPosition: entity.viewPosition,
        name: entity.name,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class InternalSquadConverter extends UniversalConverter<
    InternalSquadEntity,
    InternalSquads
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
