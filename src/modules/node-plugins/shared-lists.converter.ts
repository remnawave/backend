import { SharedLists } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { SharedListEntity } from './entities/shared-list.entity';

const modelToEntity = (model: SharedLists): SharedListEntity => {
    return new SharedListEntity(model);
};

const entityToModel = (entity: SharedListEntity): SharedLists => {
    return {
        name: entity.name,
        config: entity.config,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class SharedListsConverter extends UniversalConverter<SharedListEntity, SharedLists> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
