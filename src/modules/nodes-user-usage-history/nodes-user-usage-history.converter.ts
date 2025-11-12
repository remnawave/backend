import { NodesUserUsageHistory } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { NodesUserUsageHistoryEntity } from './entities/nodes-user-usage-history.entity';

const modelToEntity = (model: NodesUserUsageHistory): NodesUserUsageHistoryEntity => {
    return new NodesUserUsageHistoryEntity(model);
};

const entityToModel = (entity: NodesUserUsageHistoryEntity): NodesUserUsageHistory => {
    return {
        nodeId: entity.nodeId,
        userId: entity.userId,
        totalBytes: entity.totalBytes,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class NodesUserUsageHistoryConverter extends UniversalConverter<
    NodesUserUsageHistoryEntity,
    NodesUserUsageHistory
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
