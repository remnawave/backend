import { NodePlugin } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { NodePluginEntity } from './entities/node-plugin.entity';

const modelToEntity = (model: NodePlugin): NodePluginEntity => {
    return new NodePluginEntity(model);
};

const entityToModel = (entity: NodePluginEntity): NodePlugin => {
    return {
        uuid: entity.uuid,
        viewPosition: entity.viewPosition,
        name: entity.name,
        pluginConfig: entity.pluginConfig,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class NodePluginConverter extends UniversalConverter<NodePluginEntity, NodePlugin> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
