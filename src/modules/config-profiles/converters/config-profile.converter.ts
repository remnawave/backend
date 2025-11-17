import { ConfigProfiles } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { ConfigProfileEntity } from '../entities/config-profile.entity';

const modelToEntity = (model: ConfigProfiles): ConfigProfileEntity => {
    return new ConfigProfileEntity(model);
};

const entityToModel = (entity: ConfigProfileEntity): ConfigProfiles => {
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
export class ConfigProfileConverter extends UniversalConverter<
    ConfigProfileEntity,
    ConfigProfiles
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
