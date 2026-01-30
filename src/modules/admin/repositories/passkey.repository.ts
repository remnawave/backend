import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';

import { PasskeyConverter } from '../converters';
import { PasskeyEntity } from '../entities';

@Injectable()
export class PasskeyRepository implements ICrud<PasskeyEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly passkeyConverter: PasskeyConverter,
    ) {}

    public async create(entity: PasskeyEntity): Promise<PasskeyEntity> {
        const model = this.passkeyConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.passkeys.create({
            data: model,
        });

        return this.passkeyConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(id: string): Promise<PasskeyEntity | null> {
        const result = await this.prisma.tx.passkeys.findUnique({
            where: { id },
        });
        if (!result) {
            return null;
        }
        return this.passkeyConverter.fromPrismaModelToEntity(result);
    }

    public async update({ id, ...data }: Partial<PasskeyEntity>): Promise<PasskeyEntity> {
        const result = await this.prisma.tx.passkeys.update({
            where: {
                id,
            },
            data,
        });

        return this.passkeyConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(dto: Partial<PasskeyEntity>): Promise<PasskeyEntity[]> {
        const passkeyList = await this.prisma.tx.passkeys.findMany({
            where: dto,
            orderBy: {
                createdAt: 'asc',
            },
        });
        return this.passkeyConverter.fromPrismaModelsToEntities(passkeyList);
    }

    public async findFirstByCriteria(dto: Partial<PasskeyEntity>): Promise<PasskeyEntity | null> {
        const result = await this.prisma.tx.passkeys.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.passkeyConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(id: string): Promise<boolean> {
        const result = await this.prisma.tx.passkeys.delete({ where: { id } });
        return !!result;
    }

    public async countByCriteria(dto: Partial<PasskeyEntity>): Promise<number> {
        const result = await this.prisma.tx.passkeys.count({ where: dto });
        return result;
    }
}
