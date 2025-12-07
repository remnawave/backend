import { Prisma } from '@prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';

import { SubscriptionTemplateEntity } from '../entities/subscription-template.entity';
import { SubscriptionTemplateConverter } from '../subscription-template.converter';

@Injectable()
export class SubscriptionTemplateRepository implements ICrud<SubscriptionTemplateEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: SubscriptionTemplateConverter,
    ) {}

    public async create(entity: SubscriptionTemplateEntity): Promise<SubscriptionTemplateEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.subscriptionTemplate.create({
            data: {
                ...model,
                templateJson: model.templateJson as Prisma.InputJsonValue,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<null | SubscriptionTemplateEntity> {
        const result = await this.prisma.tx.subscriptionTemplate.findUnique({
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
    }: Partial<SubscriptionTemplateEntity>): Promise<SubscriptionTemplateEntity> {
        const model = this.converter.fromEntityToPrismaModel({
            uuid,
            ...data,
        } as SubscriptionTemplateEntity);
        const result = await this.prisma.tx.subscriptionTemplate.update({
            where: { uuid },
            data: {
                ...model,
                templateJson: model.templateJson as Prisma.InputJsonValue,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<SubscriptionTemplateEntity>,
    ): Promise<SubscriptionTemplateEntity[]> {
        const model = this.converter.fromEntityToPrismaModel(dto as SubscriptionTemplateEntity);
        const list = await this.prisma.tx.subscriptionTemplate.findMany({
            where: {
                ...model,
                templateJson: model.templateJson
                    ? { equals: model.templateJson as Prisma.InputJsonValue }
                    : undefined,
            },
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async findFirst(): Promise<null | SubscriptionTemplateEntity> {
        const result = await this.prisma.tx.subscriptionTemplate.findFirst();
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findFirstByTemplateType(
        templateType: TSubscriptionTemplateType,
    ): Promise<null | SubscriptionTemplateEntity> {
        const result = await this.prisma.tx.subscriptionTemplate.findFirst({
            where: {
                templateType,
            },
        });
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.subscriptionTemplate.delete({ where: { uuid } });
        return !!result;
    }

    public async getAllTemplates(
        withContent: boolean = true,
    ): Promise<SubscriptionTemplateEntity[]> {
        const result = await this.prisma.tx.subscriptionTemplate.findMany({
            select: {
                viewPosition: true,
                name: true,
                templateType: true,
                uuid: true,
                ...(withContent
                    ? {
                          templateYaml: true,
                          templateJson: true,
                      }
                    : {}),
            },
            orderBy: {
                viewPosition: 'asc',
            },
        });
        return result.map((item) => new SubscriptionTemplateEntity(item));
    }

    public async getTemplateByNameAndTypeOrGetDefault(
        name: string,
        type: TSubscriptionTemplateType,
    ): Promise<null | SubscriptionTemplateEntity> {
        let result = null;

        result = await this.prisma.tx.subscriptionTemplate.findFirst({
            where: {
                name,
                templateType: type,
            },
        });

        if (result) {
            return this.converter.fromPrismaModelToEntity(result);
        }

        result = await this.prisma.tx.subscriptionTemplate.findFirst({
            where: {
                name: 'Default',
                templateType: type,
            },
        });
        if (result) {
            return this.converter.fromPrismaModelToEntity(result);
        }

        return null;
    }

    public async reorderMany(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.subscriptionTemplate.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('subscription_templates_view_position_seq', (SELECT MAX(view_position) FROM subscription_templates) + 1)`;

        return true;
    }
}
