import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { Prisma } from '@prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { ICrud } from '@common/types/crud-port';
import { getKyselyUuid } from '@common/helpers';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';

import { ExternalSquadEntity, ExternalSquadWithInfoEntity } from '../entities';
import { ExternalSquadConverter } from '../external-squads.converter';
import {} from '../entities';

@Injectable()
export class ExternalSquadRepository implements ICrud<ExternalSquadEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly externalSquadConverter: ExternalSquadConverter,
    ) {}

    public async create(entity: ExternalSquadEntity): Promise<ExternalSquadEntity> {
        const model = this.externalSquadConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.externalSquads.create({
            data: {
                ...model,
                subscriptionSettings: model.subscriptionSettings as Prisma.InputJsonValue,
            },
        });

        return this.externalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<ExternalSquadEntity | null> {
        const result = await this.prisma.tx.externalSquads.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.externalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<ExternalSquadEntity>): Promise<ExternalSquadEntity> {
        const result = await this.prisma.tx.externalSquads.update({
            where: {
                uuid,
            },
            data: {
                ...data,
                subscriptionSettings: data.subscriptionSettings as Prisma.InputJsonValue,
            },
        });

        return this.externalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<
            Omit<
                ExternalSquadEntity,
                | 'customRemarks'
                | 'subscriptionSettings'
                | 'hostOverrides'
                | 'responseHeaders'
                | 'hwidSettings'
            >
        >,
    ): Promise<ExternalSquadEntity[]> {
        const externalSquadList = await this.prisma.tx.externalSquads.findMany({
            where: {
                ...dto,
            },
        });
        return this.externalSquadConverter.fromPrismaModelsToEntities(externalSquadList);
    }

    public async findFirstByCriteria(
        dto: Partial<
            Omit<
                ExternalSquadEntity,
                | 'customRemarks'
                | 'subscriptionSettings'
                | 'hostOverrides'
                | 'responseHeaders'
                | 'hwidSettings'
            >
        >,
    ): Promise<ExternalSquadEntity | null> {
        const result = await this.prisma.tx.externalSquads.findFirst({
            where: {
                ...dto,
            },
        });

        if (!result) {
            return null;
        }

        return this.externalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.externalSquads.delete({ where: { uuid } });
        return !!result;
    }

    public async getExternalSquads(): Promise<ExternalSquadWithInfoEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('externalSquads')
            .select((eb) => [
                'externalSquads.uuid',
                'externalSquads.viewPosition',
                'externalSquads.name',
                'externalSquads.subscriptionSettings',
                'externalSquads.hostOverrides',
                'externalSquads.responseHeaders',
                'externalSquads.hwidSettings',
                'externalSquads.customRemarks',
                'externalSquads.subpageConfigUuid',
                'externalSquads.createdAt',
                'externalSquads.updatedAt',

                eb
                    .selectFrom('users')
                    .select(eb.fn.countAll().as('count'))
                    .whereRef('users.externalSquadUuid', '=', 'externalSquads.uuid')
                    .as('membersCount'),

                jsonArrayFrom(
                    eb
                        .selectFrom('externalSquadsTemplates as est')
                        .whereRef('est.externalSquadUuid', '=', 'externalSquads.uuid')
                        .select(['est.templateType', 'est.templateUuid']),
                ).as('templates'),
            ])
            .orderBy('externalSquads.viewPosition', 'asc')
            .execute();

        return result.map((item) => new ExternalSquadWithInfoEntity(item));
    }

    public async getExternalSquadByUuid(uuid: string): Promise<ExternalSquadWithInfoEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('externalSquads')
            .where('externalSquads.uuid', '=', getKyselyUuid(uuid))
            .select((eb) => [
                'externalSquads.uuid',
                'externalSquads.viewPosition',
                'externalSquads.name',
                'externalSquads.subscriptionSettings',
                'externalSquads.hostOverrides',
                'externalSquads.responseHeaders',
                'externalSquads.hwidSettings',
                'externalSquads.customRemarks',
                'externalSquads.subpageConfigUuid',
                'externalSquads.createdAt',
                'externalSquads.updatedAt',

                eb
                    .selectFrom('users')
                    .select(eb.fn.countAll().as('count'))
                    .whereRef('users.externalSquadUuid', '=', 'externalSquads.uuid')
                    .as('membersCount'),

                jsonArrayFrom(
                    eb
                        .selectFrom('externalSquadsTemplates as est')
                        .whereRef('est.externalSquadUuid', '=', 'externalSquads.uuid')
                        .select(['est.templateType', 'est.templateUuid']),
                ).as('templates'),
            ])
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new ExternalSquadWithInfoEntity(result);
    }

    public async createTemplates(
        templates: {
            templateType: TSubscriptionTemplateType;
            templateUuid: string;
        }[],
        externalSquadUuid: string,
    ): Promise<{
        affectedCount: number;
    }> {
        const result = await this.prisma.tx.externalSquadsTemplates.createMany({
            data: templates.map((template) => ({
                externalSquadUuid,
                templateType: template.templateType,
                templateUuid: template.templateUuid,
            })),
            skipDuplicates: true,
        });

        return {
            affectedCount: result.count,
        };
    }

    public async cleanTemplates(externalSquadUuid: string): Promise<{
        affectedCount: number;
    }> {
        const result = await this.prisma.tx.externalSquadsTemplates.deleteMany({
            where: {
                externalSquadUuid,
            },
        });

        return {
            affectedCount: result.count,
        };
    }

    public async addUsersToExternalSquad(externalSquadUuid: string): Promise<{
        affectedCount: number;
    }> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({
                externalSquadUuid: getKyselyUuid(externalSquadUuid),
            })
            .execute();

        return {
            affectedCount: result.length,
        };
    }

    public async removeUsersFromExternalSquad(externalSquadUuid: string): Promise<{
        affectedCount: number;
    }> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({
                externalSquadUuid: null,
            })
            .where('externalSquadUuid', '=', getKyselyUuid(externalSquadUuid))
            .execute();

        return {
            affectedCount: result.length,
        };
    }

    public async getTemplateName(
        externalSquadUuid: string,
        templateType: TSubscriptionTemplateType,
    ): Promise<string | null> {
        const result = await this.qb.kysely
            .selectFrom('externalSquadsTemplates')
            .leftJoin(
                'subscriptionTemplates',
                'subscriptionTemplates.uuid',
                'externalSquadsTemplates.templateUuid',
            )
            .where(
                'externalSquadsTemplates.externalSquadUuid',
                '=',
                getKyselyUuid(externalSquadUuid),
            )
            .where('externalSquadsTemplates.templateType', '=', templateType)
            .select(['subscriptionTemplates.name as templateName'])
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return result.templateName;
    }

    public async getExternalSquadSettings(
        externalSquadUuid: string,
    ): Promise<Pick<
        ExternalSquadEntity,
        | 'subscriptionSettings'
        | 'hostOverrides'
        | 'responseHeaders'
        | 'hwidSettings'
        | 'customRemarks'
    > | null> {
        const result = await this.prisma.tx.externalSquads.findUnique({
            where: { uuid: externalSquadUuid },
            select: {
                subscriptionSettings: true,
                hostOverrides: true,
                responseHeaders: true,
                hwidSettings: true,
                customRemarks: true,
            },
        });

        if (!result) {
            return null;
        }

        return new ExternalSquadEntity(result);
    }

    public async reorderMany(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.externalSquads.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('external_squads_view_position_seq', (SELECT MAX(view_position) FROM external_squads) + 1)`;

        return true;
    }
}
