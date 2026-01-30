import { Prisma, PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrudWithName } from '@common/types/crud-port';
import { TxKyselyService } from '@common/database';

import { SnippetsConverter } from '../converters/snippets.converter';
import { SnippetEntity } from '../entities/snippet.entity';

@Injectable()
export class SnippetsRepository implements ICrudWithName<SnippetEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly qb: TxKyselyService,
        private readonly snippetsConverter: SnippetsConverter,
    ) {}

    public async create(entity: SnippetEntity): Promise<SnippetEntity> {
        const model = this.snippetsConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.configProfileSnippets.create({
            data: {
                ...model,
                snippet: model.snippet as Prisma.InputJsonArray,
            },
        });

        return this.snippetsConverter.fromPrismaModelToEntity(result);
    }

    public async findByName(name: string): Promise<SnippetEntity | null> {
        const result = await this.prisma.tx.configProfileSnippets.findUnique({
            where: { name },
        });
        if (!result) {
            return null;
        }
        return this.snippetsConverter.fromPrismaModelToEntity(result);
    }

    public async update({ name, ...data }: Partial<SnippetEntity>): Promise<SnippetEntity> {
        const result = await this.prisma.tx.configProfileSnippets.update({
            where: {
                name,
            },
            data: {
                ...data,
                snippet: data.snippet as Prisma.InputJsonArray,
            },
        });

        return this.snippetsConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByName(name: string): Promise<boolean> {
        const result = await this.prisma.tx.configProfileSnippets.delete({
            where: { name },
        });
        return result !== null;
    }

    public async getAllSnippets(): Promise<SnippetEntity[]> {
        const result = await this.prisma.tx.configProfileSnippets.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });
        return this.snippetsConverter.fromPrismaModelsToEntities(result);
    }
}
