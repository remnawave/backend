import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';

import { KeygenEntity } from '../entities/keygen.entity';
import { KeygenConverter } from '../keygen.converter';

@Injectable()
export class KeygenRepository implements ICrud<KeygenEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly keygenConverter: KeygenConverter,
    ) {}

    public async create(entity: KeygenEntity): Promise<KeygenEntity> {
        const model = this.keygenConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.keygen.create({
            data: model,
        });

        return this.keygenConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<KeygenEntity | null> {
        const result = await this.prisma.tx.keygen.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.keygenConverter.fromPrismaModelToEntity(result);
    }

    public async update({ uuid, ...data }: Partial<KeygenEntity>): Promise<KeygenEntity> {
        const result = await this.prisma.tx.keygen.update({
            where: {
                uuid,
            },
            data,
        });

        return this.keygenConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(dto: Partial<KeygenEntity>): Promise<KeygenEntity[]> {
        const keygenList = await this.prisma.tx.keygen.findMany({
            where: dto,
        });
        return this.keygenConverter.fromPrismaModelsToEntities(keygenList);
    }

    public async findFirstByCriteria(dto: Partial<KeygenEntity>): Promise<KeygenEntity | null> {
        const result = await this.prisma.tx.keygen.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.keygenConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.keygen.delete({ where: { uuid } });
        return !!result;
    }
}
