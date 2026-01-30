import { jsonArrayFrom, jsonBuildObject } from 'kysely/helpers/postgres';
import { sql } from 'kysely';

import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { getKyselyUuid } from '@common/helpers/kysely';
import { TxKyselyService } from '@common/database';
import { ICrud } from '@common/types/crud-port';

import { InfraProviderConverter } from '../converters';
import { InfraProviderEntity } from '../entities';

@Injectable()
export class InfraProviderRepository implements ICrud<InfraProviderEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly qb: TxKyselyService,
        private readonly infraProviderConverter: InfraProviderConverter,
    ) {}

    public async create(entity: InfraProviderEntity): Promise<InfraProviderEntity> {
        const model = this.infraProviderConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.infraProviders.create({
            data: model,
        });

        return this.infraProviderConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<InfraProviderEntity | null> {
        const result = await this.prisma.tx.infraProviders.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.infraProviderConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<InfraProviderEntity>): Promise<InfraProviderEntity> {
        const result = await this.prisma.tx.infraProviders.update({
            where: {
                uuid,
            },
            data,
        });

        return this.infraProviderConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(dto: Partial<InfraProviderEntity>): Promise<InfraProviderEntity[]> {
        const infraProviderList = await this.prisma.tx.infraProviders.findMany({
            where: dto,
            orderBy: {
                createdAt: 'asc',
            },
        });
        return this.infraProviderConverter.fromPrismaModelsToEntities(infraProviderList);
    }

    public async findFirstByCriteria(
        dto: Partial<InfraProviderEntity>,
    ): Promise<InfraProviderEntity | null> {
        const result = await this.prisma.tx.infraProviders.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.infraProviderConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.infraProviders.delete({ where: { uuid } });
        return !!result;
    }

    public async getFullInfraProviders(): Promise<InfraProviderEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('infraProviders as ip')
            .leftJoin('infraBillingHistory as ibh', 'ibh.providerUuid', 'ip.uuid')
            .select([
                'ip.uuid',
                'ip.name',
                'ip.faviconLink',
                'ip.loginUrl',
                'ip.createdAt',
                'ip.updatedAt',

                (eb) =>
                    jsonBuildObject({
                        totalAmount: sql<number>`coalesce(round(sum(ibh.amount)::numeric, 2), 0)`,
                        totalBills: eb.fn.coalesce(eb.fn.count('ibh.uuid'), eb.lit(0)),
                    }).as('billingHistory'),

                (eb) =>
                    jsonArrayFrom(
                        eb
                            .selectFrom('infraBillingNodes as ibn')
                            .innerJoin('nodes as n', 'ibn.nodeUuid', 'n.uuid')
                            .select(['ibn.nodeUuid', 'n.name', 'n.countryCode'])
                            .where('ibn.providerUuid', '=', eb.ref('ip.uuid'))
                            .orderBy('n.viewPosition', 'asc'),
                    ).as('billingNodes'),
            ])
            .groupBy([
                'ip.uuid',
                'ip.name',
                'ip.faviconLink',
                'ip.loginUrl',
                'ip.createdAt',
                'ip.updatedAt',
            ])
            .orderBy('ip.createdAt', 'asc')
            .execute();

        return result.map((item) => new InfraProviderEntity(item));
    }

    public async getFullInfraProvidersByUuid(uuid: string): Promise<InfraProviderEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('infraProviders as ip')
            .where('ip.uuid', '=', getKyselyUuid(uuid))
            .leftJoin('infraBillingHistory as ibh', 'ibh.providerUuid', 'ip.uuid')
            .select([
                'ip.uuid',
                'ip.name',
                'ip.faviconLink',
                'ip.loginUrl',
                'ip.createdAt',
                'ip.updatedAt',

                (eb) =>
                    jsonBuildObject({
                        totalAmount: sql<number>`coalesce(round(sum(ibh.amount)::numeric, 2), 0)`,
                        totalBills: eb.fn.coalesce(eb.fn.count('ibh.uuid'), eb.lit(0)),
                    }).as('billingHistory'),

                (eb) =>
                    jsonArrayFrom(
                        eb
                            .selectFrom('infraBillingNodes as ibn')
                            .innerJoin('nodes as n', 'ibn.nodeUuid', 'n.uuid')
                            .select(['ibn.nodeUuid', 'n.name', 'n.countryCode'])
                            .where('ibn.providerUuid', '=', eb.ref('ip.uuid'))
                            .orderBy('n.viewPosition', 'asc'),
                    ).as('billingNodes'),
            ])
            .groupBy([
                'ip.uuid',
                'ip.name',
                'ip.faviconLink',
                'ip.loginUrl',
                'ip.createdAt',
                'ip.updatedAt',
            ])
            .executeTakeFirst();

        return result ? new InfraProviderEntity(result) : null;
    }
}
