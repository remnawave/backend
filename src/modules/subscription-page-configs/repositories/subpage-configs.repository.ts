import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';

import { SubscriptionPageConfigEntity } from '../entities/sub-page-config.entity';
import { SubscriptionPageConfigConverter } from '../subpage-configs.converter';

@Injectable()
export class SubscriptionPageConfigRepository implements ICrud<SubscriptionPageConfigEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly converter: SubscriptionPageConfigConverter,
    ) {}

    public async create(
        entity: SubscriptionPageConfigEntity,
    ): Promise<SubscriptionPageConfigEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.subscriptionPageConfig.create({
            data: {
                ...model,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<null | SubscriptionPageConfigEntity> {
        const result = await this.prisma.tx.subscriptionPageConfig.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<SubscriptionPageConfigEntity>): Promise<SubscriptionPageConfigEntity> {
        const model = this.converter.fromEntityToPrismaModel({
            uuid,
            ...data,
        } as SubscriptionPageConfigEntity);
        const result = await this.prisma.tx.subscriptionPageConfig.update({
            where: { uuid },
            data: {
                ...model,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<Omit<SubscriptionPageConfigEntity, 'config'>>,
    ): Promise<SubscriptionPageConfigEntity[]> {
        const model = this.converter.fromEntityToPrismaModel(dto as SubscriptionPageConfigEntity);
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const { config, ...rest } = model;
        const list = await this.prisma.tx.subscriptionPageConfig.findMany({
            where: {
                ...rest,
            },
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async findFirst(): Promise<null | SubscriptionPageConfigEntity> {
        const result = await this.prisma.tx.subscriptionPageConfig.findFirst();
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findFirstByName(name: string): Promise<null | SubscriptionPageConfigEntity> {
        const result = await this.prisma.tx.subscriptionPageConfig.findFirst({
            where: {
                name,
            },
        });
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.subscriptionPageConfig.delete({ where: { uuid } });
        return !!result;
    }

    public async getAllConfigs(
        withContent: boolean = true,
    ): Promise<SubscriptionPageConfigEntity[]> {
        const result = await this.prisma.tx.subscriptionPageConfig.findMany({
            select: {
                viewPosition: true,
                name: true,
                uuid: true,
                ...(withContent
                    ? {
                          config: true,
                      }
                    : {
                          config: false,
                      }),
            },
            orderBy: {
                viewPosition: 'asc',
            },
        });
        return result.map((item) => new SubscriptionPageConfigEntity(item));
    }

    public async reorderMany(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.subscriptionPageConfig.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('subscription_page_config_view_position_seq', (SELECT MAX(view_position) FROM subscription_page_config) + 1)`;

        return true;
    }
}
