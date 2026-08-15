import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';

import { NodeIntegrationEntity } from '../entities/node-integration.entity';
import { NodeIntegrationConverter } from '../node-integrations.converter';

@Injectable()
export class NodeIntegrationRepository implements ICrud<NodeIntegrationEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: NodeIntegrationConverter,
    ) {}

    public async create(entity: NodeIntegrationEntity): Promise<NodeIntegrationEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);

        const result = await this.prisma.tx.integrations.create({
            data: {
                name: model.name,
                description: model.description,
                config: model.config as Prisma.InputJsonValue,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<NodeIntegrationEntity | null> {
        const result = await this.prisma.tx.integrations.findUnique({
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
    }: Partial<NodeIntegrationEntity>): Promise<NodeIntegrationEntity> {
        const result = await this.prisma.tx.integrations.update({
            where: { uuid },
            data: {
                name: data.name,
                description: data.description,
                config: data.config as Prisma.InputJsonValue | undefined,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<Omit<NodeIntegrationEntity, 'config'>>,
    ): Promise<NodeIntegrationEntity[]> {
        const list = await this.prisma.tx.integrations.findMany({
            where: {
                uuid: dto.uuid,
                name: dto.name,
            },
        });

        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.integrations.delete({ where: { uuid } });

        return !!result;
    }

    public async getAllIntegrations(): Promise<NodeIntegrationEntity[]> {
        const list = await this.prisma.tx.integrations.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });

        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async getIntegrationsByUuids(
        uuids: string[],
    ): Promise<Map<string, NodeIntegrationEntity>> {
        if (uuids.length === 0) {
            return new Map();
        }

        const list = await this.prisma.tx.integrations.findMany({
            where: {
                uuid: {
                    in: uuids,
                },
            },
        });

        return new Map(
            list.map((model) => [model.uuid, this.converter.fromPrismaModelToEntity(model)]),
        );
    }
}
