import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';

import { AdminConverter } from '../converters/admin.converter';
import { AdminEntity } from '../entities/admin.entity';

@Injectable()
export class AdminRepository implements ICrud<AdminEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly adminConverter: AdminConverter,
    ) {}

    public async create(entity: AdminEntity): Promise<AdminEntity> {
        const model = this.adminConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.admin.create({
            data: model,
        });

        return this.adminConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<AdminEntity | null> {
        const result = await this.prisma.tx.admin.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.adminConverter.fromPrismaModelToEntity(result);
    }

    public async update({ uuid, ...data }: Partial<AdminEntity>): Promise<AdminEntity> {
        const result = await this.prisma.tx.admin.update({
            where: {
                uuid,
            },
            data,
        });

        return this.adminConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(dto: Partial<AdminEntity>): Promise<AdminEntity[]> {
        const adminList = await this.prisma.tx.admin.findMany({
            where: dto,
            orderBy: {
                createdAt: 'asc',
            },
        });
        return this.adminConverter.fromPrismaModelsToEntities(adminList);
    }

    public async findFirstByCriteria(dto: Partial<AdminEntity>): Promise<AdminEntity | null> {
        const result = await this.prisma.tx.admin.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.adminConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.admin.delete({ where: { uuid } });
        return !!result;
    }

    public async countByCriteria(dto: Partial<AdminEntity>): Promise<number> {
        const result = await this.prisma.tx.admin.count({ where: dto });
        return result;
    }
}
