import { NodeMeta } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { NodeMetadataEntity } from '../entities';

const modelToEntity = (model: NodeMeta): NodeMetadataEntity => {
    return new NodeMetadataEntity(model);
};

const entityToModel = (entity: NodeMetadataEntity): NodeMeta => {
    return {
        nodeId: entity.nodeId,
        metadata: entity.metadata,
    };
};

@Injectable()
export class NodeMetadataConverter extends UniversalConverter<NodeMetadataEntity, NodeMeta> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
