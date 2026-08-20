import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';
import { sql } from 'kysely';

import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { ICrudWithName } from '@common/types/crud-port';

import { SharedListEntity } from '../entities/shared-list.entity';
import { ISharedListPreview } from '../interfaces/shared-list-preview.interface';
import { SharedListsConverter } from '../shared-lists.converter';

@Injectable()
export class SharedListsRepository implements ICrudWithName<SharedListEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly converter: SharedListsConverter,
    ) {}

    public async create(entity: SharedListEntity): Promise<SharedListEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);

        const result = await this.prisma.tx.sharedLists.create({
            data: {
                name: model.name,
                config: model.config as Prisma.InputJsonValue,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByName(name: string): Promise<null | SharedListEntity> {
        const result = await this.prisma.tx.sharedLists.findUnique({
            where: { name },
        });

        if (!result) {
            return null;
        }

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async update({ name, ...data }: Partial<SharedListEntity>): Promise<SharedListEntity> {
        const result = await this.prisma.tx.sharedLists.update({
            where: { name },
            data: {
                config: data.config as Prisma.InputJsonValue | undefined,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async deleteByName(name: string): Promise<boolean> {
        const result = await this.prisma.tx.sharedLists.delete({
            where: { name },
        });

        return result !== null;
    }

    public async getAllSharedLists(): Promise<SharedListEntity[]> {
        const result = await this.prisma.tx.sharedLists.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });

        return this.converter.fromPrismaModelsToEntities(result);
    }

    public async getAllSharedListsPreview(): Promise<ISharedListPreview[]> {
        const config = sql.ref('shared_lists.config');

        return this.qb.kysely
            .selectFrom('sharedLists')
            .select([
                'name',
                sql<string>`${config} ->> 'type'`.as('type'),
                sql<number>`case
                    when jsonb_typeof(${config} -> 'items') = 'array'
                        then jsonb_array_length(${config} -> 'items')
                    else 0
                end`.as('itemsCount'),
            ])
            .orderBy('createdAt', 'asc')
            .execute();
    }
}
