import { UserMeta } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { UserMetadataEntity } from '../entities';

const modelToEntity = (model: UserMeta): UserMetadataEntity => {
    return new UserMetadataEntity(model);
};

const entityToModel = (entity: UserMetadataEntity): UserMeta => {
    return {
        userId: entity.userId,
        metadata: entity.metadata,
    };
};

@Injectable()
export class UserMetadataConverter extends UniversalConverter<UserMetadataEntity, UserMeta> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
