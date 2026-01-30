import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrudWithId } from '@common/types/crud-port';

import { NodesTrafficUsageHistoryEntity } from '../entities/nodes-traffic-usage-history.entity';
import { NodesTrafficUsageHistoryConverter } from '../nodes-traffic-usage-history.converter';

@Injectable()
export class NodesTrafficUsageHistoryRepository implements ICrudWithId<NodesTrafficUsageHistoryEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly converter: NodesTrafficUsageHistoryConverter,
    ) {}

    public async create(
        entity: NodesTrafficUsageHistoryEntity,
    ): Promise<NodesTrafficUsageHistoryEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.nodesTrafficUsageHistory.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findById(id: number | bigint): Promise<NodesTrafficUsageHistoryEntity | null> {
        const result = await this.prisma.tx.nodesTrafficUsageHistory.findUnique({
            where: { id },
        });
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async update({
        id,
        ...data
    }: Partial<NodesTrafficUsageHistoryEntity>): Promise<NodesTrafficUsageHistoryEntity> {
        const result = await this.prisma.tx.nodesTrafficUsageHistory.update({
            where: {
                id,
            },
            data,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<NodesTrafficUsageHistoryEntity>,
    ): Promise<NodesTrafficUsageHistoryEntity[]> {
        const list = await this.prisma.tx.nodesTrafficUsageHistory.findMany({
            where: dto,
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async deleteById(id: bigint | number): Promise<boolean> {
        const result = await this.prisma.tx.nodesTrafficUsageHistory.delete({ where: { id } });
        return !!result;
    }
}
