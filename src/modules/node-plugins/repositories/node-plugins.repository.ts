import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';

import { NodePluginEntity } from '../entities/node-plugin.entity';
import { NodePluginConverter } from '../node-plugins.converter';

@Injectable()
export class NodePluginRepository implements ICrud<NodePluginEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: NodePluginConverter,
    ) {}

    public async create(entity: NodePluginEntity): Promise<NodePluginEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.nodePlugin.create({
            data: {
                ...model,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<null | NodePluginEntity> {
        const result = await this.prisma.tx.nodePlugin.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async update({ uuid, ...data }: Partial<NodePluginEntity>): Promise<NodePluginEntity> {
        const model = this.converter.fromEntityToPrismaModel({
            uuid,
            ...data,
        } as NodePluginEntity);
        const result = await this.prisma.tx.nodePlugin.update({
            where: { uuid },
            data: {
                ...model,
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<Omit<NodePluginEntity, 'pluginConfig'>>,
    ): Promise<NodePluginEntity[]> {
        const model = this.converter.fromEntityToPrismaModel(dto as NodePluginEntity);
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const { pluginConfig, ...rest } = model;
        const list = await this.prisma.tx.nodePlugin.findMany({
            where: {
                ...rest,
            },
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async findFirst(): Promise<null | NodePluginEntity> {
        const result = await this.prisma.tx.nodePlugin.findFirst();
        if (!result) {
            return null;
        }
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findFirstByName(name: string): Promise<null | NodePluginEntity> {
        const result = await this.prisma.tx.nodePlugin.findFirst({
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
        const result = await this.prisma.tx.nodePlugin.delete({ where: { uuid } });
        return !!result;
    }

    public async getAllNodePlugins(withContent: boolean = true): Promise<NodePluginEntity[]> {
        const result = await this.prisma.tx.nodePlugin.findMany({
            select: {
                viewPosition: true,
                name: true,
                uuid: true,
                ...(withContent
                    ? {
                          pluginConfig: true,
                      }
                    : {
                          pluginConfig: false,
                      }),
            },
            orderBy: {
                viewPosition: 'asc',
            },
        });
        return result.map((item) => new NodePluginEntity(item));
    }

    public async reorderMany(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.nodePlugin.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('node_plugin_view_position_seq', (SELECT MAX(view_position) FROM node_plugin) + 1)`;

        return true;
    }
}
