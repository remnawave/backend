import type { NodesTrafficUsageHistoryModel as NodesTrafficUsageHistory } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { NodesTrafficUsageHistoryEntity } from './entities/nodes-traffic-usage-history.entity';

const modelToEntity = (model: NodesTrafficUsageHistory): NodesTrafficUsageHistoryEntity => {
    return new NodesTrafficUsageHistoryEntity(model);
};

const entityToModel = (entity: NodesTrafficUsageHistoryEntity): NodesTrafficUsageHistory => {
    return {
        id: entity.id,
        nodeUuid: entity.nodeUuid,
        trafficBytes: entity.trafficBytes,
        resetAt: entity.resetAt,
    };
};

@Injectable()
export class NodesTrafficUsageHistoryConverter extends UniversalConverter<
    NodesTrafficUsageHistoryEntity,
    NodesTrafficUsageHistory
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
