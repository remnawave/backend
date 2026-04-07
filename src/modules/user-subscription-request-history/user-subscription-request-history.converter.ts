import { UserSubscriptionRequestHistory } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { UserSubscriptionRequestHistoryEntity } from './entities/user-subscription-request-history.entity';

const modelToEntity = (
    model: UserSubscriptionRequestHistory,
): UserSubscriptionRequestHistoryEntity => {
    return new UserSubscriptionRequestHistoryEntity(model);
};

const entityToModel = (
    entity: UserSubscriptionRequestHistoryEntity,
): UserSubscriptionRequestHistory => {
    return {
        id: entity.id,
        userId: entity.userId,
        requestIp: entity.requestIp,
        userAgent: entity.userAgent,
        requestAt: entity.requestAt,
    };
};

@Injectable()
export class UserSubscriptionRequestHistoryConverter extends UniversalConverter<
    UserSubscriptionRequestHistoryEntity,
    UserSubscriptionRequestHistory
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
