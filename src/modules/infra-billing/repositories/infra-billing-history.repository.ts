import { jsonBuildObject } from 'kysely/helpers/postgres';

import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { ICrud } from '@common/types/crud-port';

import { InfraBillingHistoryEntity } from '../entities/infra-billing-history.entity';
import { InfraBillingHistoryConverter } from '../converters';

@Injectable()
export class InfraBillingHistoryRepository implements ICrud<InfraBillingHistoryEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly qb: TxKyselyService,
        private readonly infraBillingHistoryConverter: InfraBillingHistoryConverter,
    ) {}

    public async create(entity: InfraBillingHistoryEntity): Promise<InfraBillingHistoryEntity> {
        const model = this.infraBillingHistoryConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.infraBillingHistory.create({
            data: model,
        });

        return this.infraBillingHistoryConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<InfraBillingHistoryEntity | null> {
        const result = await this.prisma.tx.infraBillingHistory.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.infraBillingHistoryConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<InfraBillingHistoryEntity>): Promise<InfraBillingHistoryEntity> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { provider, ...rest } = data;
        const result = await this.prisma.tx.infraBillingHistory.update({
            where: {
                uuid,
            },
            data: rest,
        });

        return this.infraBillingHistoryConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<InfraBillingHistoryEntity>,
    ): Promise<InfraBillingHistoryEntity[]> {
        const infraBillingHistoryList = await this.prisma.tx.infraBillingHistory.findMany({
            where: dto,
        });
        return this.infraBillingHistoryConverter.fromPrismaModelsToEntities(
            infraBillingHistoryList,
        );
    }

    public async findFirstByCriteria(
        dto: Partial<InfraBillingHistoryEntity>,
    ): Promise<InfraBillingHistoryEntity | null> {
        const result = await this.prisma.tx.infraBillingHistory.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.infraBillingHistoryConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.infraBillingHistory.delete({ where: { uuid } });
        return !!result;
    }

    public async getInfraBillingHistoryRecords(
        start: number,
        size: number,
    ): Promise<InfraBillingHistoryEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('infraBillingHistory as ibh')
            .innerJoin('infraProviders as ip', 'ip.uuid', 'ibh.providerUuid')
            .select([
                'ibh.uuid',
                'ibh.providerUuid',
                'ibh.amount',
                'ibh.billedAt',

                (eb) =>
                    jsonBuildObject({
                        uuid: eb.ref('ip.uuid'),
                        name: eb.ref('ip.name'),
                        faviconLink: eb.ref('ip.faviconLink'),
                    }).as('provider'),
            ])
            .orderBy('ibh.billedAt', 'desc')
            .limit(size)
            .offset(start)
            .execute();

        return this.infraBillingHistoryConverter.fromPrismaModelsToEntities(result);
    }

    public async getInfraBillingHistoryRecordsCount(): Promise<number> {
        const result = await this.qb.kysely
            .selectFrom('infraBillingHistory')
            .select((eb) => [eb.fn.count<bigint>('infraBillingHistory.uuid').as('count')])
            .executeTakeFirst();

        if (!result) {
            return 0;
        }

        return Number(result.count);
    }
}
