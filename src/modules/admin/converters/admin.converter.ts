import { Admin } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { AdminEntity } from '../entities/admin.entity';

const modelToEntity = (model: Admin): AdminEntity => {
    return new AdminEntity(model);
};

const entityToModel = (entity: AdminEntity): Admin => {
    return {
        uuid: entity.uuid,
        username: entity.username,
        passwordHash: entity.passwordHash,
        role: entity.role,

        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class AdminConverter extends UniversalConverter<AdminEntity, Admin> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
