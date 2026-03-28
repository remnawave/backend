import { Nodes } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { NodesEntity } from './entities/nodes.entity';

const modelToEntity = (model: Nodes): NodesEntity => {
    return new NodesEntity(model);
};

const entityToModel = (entity: NodesEntity): Nodes => {
    return {
        id: entity.id,
        uuid: entity.uuid,
        name: entity.name,
        address: entity.address,
        port: entity.port,
        isConnected: entity.isConnected,
        isConnecting: entity.isConnecting,
        isDisabled: entity.isDisabled,
        lastStatusChange: entity.lastStatusChange,
        lastStatusMessage: entity.lastStatusMessage,
        isTrafficTrackingActive: entity.isTrafficTrackingActive,
        trafficResetDay: entity.trafficResetDay,
        trafficLimitBytes: entity.trafficLimitBytes,
        trafficUsedBytes: entity.trafficUsedBytes,
        notifyPercent: entity.notifyPercent,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        viewPosition: entity.viewPosition,
        countryCode: entity.countryCode,
        consumptionMultiplier: entity.consumptionMultiplier,
        tags: entity.tags,

        activeConfigProfileUuid: entity.activeConfigProfileUuid,
        providerUuid: entity.providerUuid,
        activePluginUuid: entity.activePluginUuid,
    };
};

@Injectable()
export class NodesConverter extends UniversalConverter<NodesEntity, Nodes> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
