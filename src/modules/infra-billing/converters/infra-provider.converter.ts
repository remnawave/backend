import type { InfraProvidersModel as InfraProviders } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { InfraProviderEntity } from '../entities';

const modelToEntity = (model: InfraProviders): InfraProviderEntity => {
    return new InfraProviderEntity(model);
};

const entityToModel = (entity: InfraProviderEntity): InfraProviders => {
    return {
        uuid: entity.uuid,
        name: entity.name,
        faviconLink: entity.faviconLink,
        loginUrl: entity.loginUrl,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class InfraProviderConverter extends UniversalConverter<
    InfraProviderEntity,
    InfraProviders
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
