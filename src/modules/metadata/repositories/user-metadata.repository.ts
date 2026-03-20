import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { UserMetadataConverter } from '../converters';
import { UserMetadataEntity } from '../entities';

@Injectable()
export class UserMetadataRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly userMetadataConverter: UserMetadataConverter,
    ) {}

    public async upsert(entity: UserMetadataEntity): Promise<UserMetadataEntity> {
        const result = await this.prisma.tx.userMeta.upsert({
            where: {
                userId: entity.userId,
            },
            update: entity,
            create: entity,
        });

        return this.userMetadataConverter.fromPrismaModelToEntity(result);
    }

    public async getByUserId(userId: bigint): Promise<UserMetadataEntity | null> {
        const result = await this.prisma.tx.userMeta.findUnique({
            where: { userId },
        });
        if (!result) {
            return null;
        }
        return this.userMetadataConverter.fromPrismaModelToEntity(result);
    }
}
