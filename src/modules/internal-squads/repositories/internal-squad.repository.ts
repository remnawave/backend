import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { ICrud } from '@common/types/crud-port';
import { getKyselyUuid } from '@common/helpers';

import { IGetSquadAccessibleNodes } from '../interfaces/get-squad-accessible-nodes.interface';
import { InternalSquadEntity } from '../entities/internal-squad.entity';
import { InternalSquadConverter } from '../internal-squad.converter';
import { InternalSquadWithInfoEntity } from '../entities';

@Injectable()
export class InternalSquadRepository implements ICrud<InternalSquadEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly internalSquadConverter: InternalSquadConverter,
    ) {}

    public async create(entity: InternalSquadEntity): Promise<InternalSquadEntity> {
        const model = this.internalSquadConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.internalSquads.create({
            data: model,
        });

        return this.internalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async createWithInbounds(
        name: string,
        inbounds: string[],
    ): Promise<InternalSquadEntity> {
        const result = await this.prisma.tx.internalSquads.create({
            data: {
                name,
                internalSquadInbounds: {
                    create: inbounds.map((inbound) => ({ inboundUuid: inbound })),
                },
            },
        });

        return this.internalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<InternalSquadEntity | null> {
        const result = await this.prisma.tx.internalSquads.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.internalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<InternalSquadEntity>): Promise<InternalSquadEntity> {
        const result = await this.prisma.tx.internalSquads.update({
            where: {
                uuid,
            },
            data,
        });

        return this.internalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(dto: Partial<InternalSquadEntity>): Promise<InternalSquadEntity[]> {
        const internalSquadList = await this.prisma.tx.internalSquads.findMany({
            where: dto,
        });
        return this.internalSquadConverter.fromPrismaModelsToEntities(internalSquadList);
    }

    public async findFirstByCriteria(
        dto: Partial<InternalSquadEntity>,
    ): Promise<InternalSquadEntity | null> {
        const result = await this.prisma.tx.internalSquads.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.internalSquadConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.internalSquads.delete({ where: { uuid } });
        return !!result;
    }

    public async getInternalSquads(): Promise<InternalSquadWithInfoEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('internalSquads')
            .select((eb) => [
                'internalSquads.uuid',
                'internalSquads.viewPosition',
                'internalSquads.name',
                'internalSquads.createdAt',
                'internalSquads.updatedAt',

                eb
                    .selectFrom('internalSquadMembers')
                    .select(eb.fn.countAll().as('count'))
                    .whereRef('internalSquadMembers.internalSquadUuid', '=', 'internalSquads.uuid')
                    .as('membersCount'),

                // TODO: add members list
                // jsonArrayFrom(
                //     eb
                //         .selectFrom('internalSquadMembers')
                //         .select(['userUuid'])
                //         .whereRef(
                //             'internalSquadMembers.internalSquadUuid',
                //             '=',
                //             'internalSquads.uuid',
                //         ),
                // ).as('members'),

                eb
                    .selectFrom('internalSquadInbounds')
                    .select(eb.fn.countAll().as('count'))
                    .whereRef('internalSquadInbounds.internalSquadUuid', '=', 'internalSquads.uuid')
                    .as('inboundsCount'),

                jsonArrayFrom(
                    eb
                        .selectFrom('configProfileInbounds')
                        .selectAll()
                        .where(
                            'configProfileInbounds.uuid',
                            'in',
                            eb
                                .selectFrom('internalSquadInbounds')
                                .select('inboundUuid')
                                .whereRef(
                                    'internalSquadInbounds.internalSquadUuid',
                                    '=',
                                    'internalSquads.uuid',
                                ),
                        ),
                ).as('inbounds'),

                // jsonArrayFrom(
                //     eb
                //         .selectFrom('internalSquadInbounds')
                //         .leftJoin(
                //             'configProfileInbounds',
                //             'configProfileInbounds.uuid',
                //             'internalSquadInbounds.inboundUuid',
                //         )
                //         .selectAll('configProfileInbounds')
                //         .whereRef(
                //             'internalSquadInbounds.internalSquadUuid',
                //             '=',
                //             'internalSquads.uuid',
                //         ),
                // ).as('inbounds'),
            ])

            .groupBy([
                'internalSquads.uuid',
                'internalSquads.viewPosition',
                'internalSquads.name',
                'internalSquads.createdAt',
                'internalSquads.updatedAt',
            ])
            .orderBy('internalSquads.viewPosition', 'asc')
            .execute();

        return result.map((item) => new InternalSquadWithInfoEntity(item));
    }

    public async getInternalSquadsByUuid(
        uuid: string,
    ): Promise<InternalSquadWithInfoEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('internalSquads')
            .where('internalSquads.uuid', '=', getKyselyUuid(uuid))
            .select((eb) => [
                'internalSquads.uuid',
                'internalSquads.viewPosition',
                'internalSquads.name',
                'internalSquads.createdAt',
                'internalSquads.updatedAt',

                eb
                    .selectFrom('internalSquadMembers')
                    .select(eb.fn.countAll().as('count'))
                    .whereRef('internalSquadMembers.internalSquadUuid', '=', 'internalSquads.uuid')
                    .as('membersCount'),

                eb
                    .selectFrom('internalSquadInbounds')
                    .select(eb.fn.countAll().as('count'))
                    .whereRef('internalSquadInbounds.internalSquadUuid', '=', 'internalSquads.uuid')
                    .as('inboundsCount'),

                jsonArrayFrom(
                    eb
                        .selectFrom('configProfileInbounds')
                        .selectAll()
                        .where(
                            'configProfileInbounds.uuid',
                            'in',
                            eb
                                .selectFrom('internalSquadInbounds')
                                .select('inboundUuid')
                                .whereRef(
                                    'internalSquadInbounds.internalSquadUuid',
                                    '=',
                                    'internalSquads.uuid',
                                ),
                        ),
                ).as('inbounds'),
            ])

            .groupBy([
                'internalSquads.uuid',
                'internalSquads.viewPosition',
                'internalSquads.name',
                'internalSquads.createdAt',
                'internalSquads.updatedAt',
            ])
            .orderBy('internalSquads.viewPosition', 'asc')
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new InternalSquadWithInfoEntity(result);
    }

    public async createInbounds(
        inbounds: string[],
        internalSquadUuid: string,
    ): Promise<{
        affectedCount: number;
    }> {
        const result = await this.prisma.tx.internalSquadInbounds.createMany({
            data: inbounds.map((inbound) => ({
                inboundUuid: inbound,
                internalSquadUuid,
            })),
        });

        return {
            affectedCount: result.count,
        };
    }

    public async cleanInbounds(internalSquadUuid: string): Promise<{
        affectedCount: number;
    }> {
        const result = await this.prisma.tx.internalSquadInbounds.deleteMany({
            where: {
                internalSquadUuid,
            },
        });

        return {
            affectedCount: result.count,
        };
    }

    public async addUsersToInternalSquad(internalSquadUuid: string): Promise<{
        affectedCount: number;
    }> {
        const result = await this.qb.kysely
            .insertInto('internalSquadMembers')
            .columns(['internalSquadUuid', 'userUuid'])
            .expression((eb) =>
                eb
                    .selectFrom('users')
                    .select([
                        eb.val(getKyselyUuid(internalSquadUuid)).as('internalSquadUuid'),
                        'uuid as userUuid',
                    ]),
            )
            .onConflict((oc) => oc.doNothing())
            .clearReturning()
            .executeTakeFirstOrThrow();

        return {
            affectedCount: Number(result.numInsertedOrUpdatedRows),
        };
    }

    public async removeUsersFromInternalSquad(internalSquadUuid: string): Promise<{
        affectedCount: number;
    }> {
        const result = await this.qb.kysely
            .deleteFrom('internalSquadMembers')
            .where('internalSquadUuid', '=', getKyselyUuid(internalSquadUuid))
            .executeTakeFirst();

        return {
            affectedCount: Number(result.numDeletedRows),
        };
    }

    public async getConfigProfilesBySquadUuid(internalSquadUuid: string): Promise<string[]> {
        const configProfileUuids = await this.qb.kysely
            .selectFrom('internalSquadInbounds as isi')
            .innerJoin('configProfileInbounds as cpi', 'cpi.uuid', 'isi.inboundUuid')
            .select('cpi.profileUuid')
            .distinct()
            .where('isi.internalSquadUuid', '=', getKyselyUuid(internalSquadUuid))
            .execute();

        return configProfileUuids.map((row) => row.profileUuid);
    }

    public async getInboundsBySquadUuid(
        internalSquadUuid: string,
    ): Promise<{ inboundUuid: string; configProfileUuid: string }[]> {
        const result = await this.qb.kysely
            .selectFrom('internalSquadInbounds')
            .select('inboundUuid')
            .innerJoin(
                'configProfileInbounds',
                'configProfileInbounds.uuid',
                'internalSquadInbounds.inboundUuid',
            )
            .select('configProfileInbounds.profileUuid as configProfileUuid')
            .where('internalSquadUuid', '=', getKyselyUuid(internalSquadUuid))
            .execute();

        return result;
    }

    public async getSquadAccessibleNodes(squadUuid: string): Promise<IGetSquadAccessibleNodes> {
        const flatResults = await this.qb.kysely
            .selectFrom('nodes as n')
            .innerJoin('configProfiles as cp', 'n.activeConfigProfileUuid', 'cp.uuid')
            .innerJoin('configProfileInbounds as cpi', 'cpi.profileUuid', 'cp.uuid')
            .innerJoin('configProfileInboundsToNodes as cpin', (join) =>
                join
                    .onRef('cpin.configProfileInboundUuid', '=', 'cpi.uuid')
                    .onRef('cpin.nodeUuid', '=', 'n.uuid'),
            )
            .innerJoin('internalSquadInbounds as isi', 'isi.inboundUuid', 'cpi.uuid')
            .innerJoin('internalSquads as sq', (join) =>
                join
                    .onRef('sq.uuid', '=', 'isi.internalSquadUuid')
                    .on('sq.uuid', '=', getKyselyUuid(squadUuid)),
            )
            .select([
                'n.uuid as nodeUuid',
                'n.name as nodeName',
                'n.countryCode',
                'n.viewPosition',
                'cp.uuid as configProfileUuid',
                'cp.name as configProfileName',
                'cpi.tag as inboundTag',
            ])
            .execute();

        const nodesMap = new Map<
            string,
            {
                uuid: string;
                nodeName: string;
                countryCode: string;
                viewPosition: number;
                configProfileUuid: string;
                configProfileName: string;
                activeInbounds: Set<string>;
            }
        >();

        flatResults.forEach((row) => {
            if (!nodesMap.has(row.nodeUuid)) {
                nodesMap.set(row.nodeUuid, {
                    uuid: row.nodeUuid,
                    nodeName: row.nodeName,
                    countryCode: row.countryCode,
                    viewPosition: row.viewPosition,
                    configProfileUuid: row.configProfileUuid,
                    configProfileName: row.configProfileName,
                    activeInbounds: new Set(),
                });
            }

            const node = nodesMap.get(row.nodeUuid)!;
            node.activeInbounds.add(row.inboundTag);
        });

        const result: IGetSquadAccessibleNodes = {
            squadUuid,
            accessibleNodes: Array.from(nodesMap.values())
                .sort((a, b) => a.viewPosition - b.viewPosition)
                .map((node) => ({
                    uuid: node.uuid,
                    nodeName: node.nodeName,
                    countryCode: node.countryCode,
                    configProfileUuid: node.configProfileUuid,
                    configProfileName: node.configProfileName,
                    activeInbounds: Array.from(node.activeInbounds),
                })),
        };

        return result;
    }

    public async reorderMany(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.internalSquads.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('internal_squads_view_position_seq', (SELECT MAX(view_position) FROM internal_squads) + 1)`;

        return true;
    }
}
