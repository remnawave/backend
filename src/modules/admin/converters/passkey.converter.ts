import type { PasskeysModel as Passkeys } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { PasskeyEntity } from '../entities/passkey.entity';

const modelToEntity = (model: Passkeys): PasskeyEntity => {
    return new PasskeyEntity(model);
};

const entityToModel = (entity: PasskeyEntity): Passkeys => {
    return {
        id: entity.id,
        adminUuid: entity.adminUuid,
        publicKey: entity.publicKey,
        counter: entity.counter,
        deviceType: entity.deviceType,
        backedUp: entity.backedUp,
        transports: entity.transports,
        passkeyProvider: entity.passkeyProvider,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class PasskeyConverter extends UniversalConverter<PasskeyEntity, Passkeys> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
