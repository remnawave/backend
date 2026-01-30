import type { InfraBillingHistoryModel as InfraBillingHistory } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { InfraBillingHistoryEntity } from '../entities';

const modelToEntity = (model: InfraBillingHistory): InfraBillingHistoryEntity => {
    return new InfraBillingHistoryEntity(model);
};

const entityToModel = (entity: InfraBillingHistoryEntity): InfraBillingHistory => {
    return {
        uuid: entity.uuid,
        providerUuid: entity.providerUuid,
        amount: entity.amount,
        billedAt: entity.billedAt,
    };
};

@Injectable()
export class InfraBillingHistoryConverter extends UniversalConverter<
    InfraBillingHistoryEntity,
    InfraBillingHistory
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
