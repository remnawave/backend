import { Integrations } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { NodeIntegrationEntity } from './entities/node-integration.entity';

const modelToEntity = (model: Integrations): NodeIntegrationEntity => {
    return new NodeIntegrationEntity(model);
};

const entityToModel = (entity: NodeIntegrationEntity): Integrations => {
    return {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        config: entity.config,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class NodeIntegrationConverter extends UniversalConverter<
    NodeIntegrationEntity,
    Integrations
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
