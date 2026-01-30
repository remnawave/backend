import type { KeygenModel as Keygen } from '@generated/prisma/models';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { KeygenEntity } from './entities/keygen.entity';

const modelToEntity = (model: Keygen): KeygenEntity => {
    return new KeygenEntity(model);
};

const entityToModel = (entity: KeygenEntity): KeygenEntity => {
    return {
        uuid: entity.uuid,
        privKey: entity.privKey,
        pubKey: entity.pubKey,
        caCert: entity.caCert,
        caKey: entity.caKey,
        clientCert: entity.clientCert,
        clientKey: entity.clientKey,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class KeygenConverter extends UniversalConverter<KeygenEntity, Keygen> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
