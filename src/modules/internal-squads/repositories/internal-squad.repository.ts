import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { getKyselyUuid } from '@common/helpers';
import { values } from '@common/helpers/kysely/values';
import { ICrud } from '@common/types/crud-port';

import { InternalSquadWithInfoEntity } from '../entities';
import { InternalSquadEntity } from '../entities/internal-squad.entity';
import { IGetSquadAccessibleNodes } from '../interfaces/get-squad-accessible-nodes.interface';
import { InternalSquadConverter } from '../internal-squad.converter';

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

    public async findByCriteria(
        dto: Partial<Omit<InternalSquadEntity, 'tags'>>,
    ): Promise<InternalSquadEntity[]> {
        const internalSquadList = await this.prisma.tx.internalSquads.findMany({
            where: dto,
        });
        return this.internalSquadConverter.fromPrismaModelsToEntities(internalSquadList);
    }

    public async findFirstByCriteria(
        dto: Partial<Omit<InternalSquadEntity, 'tags'>>,
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
                'internalSquads.tags',
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
                'internalSquads.tags',
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
            .columns(['internalSquadUuid', 'userId'])
            .expression((eb) =>
                eb
                    .selectFrom('users')
                    .select([
                        eb.val(getKyselyUuid(internalSquadUuid)).as('internalSquadUuid'),
                        'id',
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

    private getSquadNodesQuery(squadUuid: string) {
        return this.qb.kysely
            .selectFrom('nodes as n')
            .innerJoin('configProfiles as cp', 'n.activeConfigProfileUuid', 'cp.uuid')
            .innerJoin('configProfileInbounds as cpi', 'cpi.profileUuid', 'cp.uuid')
            .innerJoin('configProfileInboundsToNodes as cpin', (join) =>
                join
                    .onRef('cpin.configProfileInboundUuid', '=', 'cpi.uuid')
                    .onRef('cpin.nodeUuid', '=', 'n.uuid'),
            )
            .innerJoin('internalSquadInbounds as isi', 'isi.inboundUuid', 'cpi.uuid')
            .where('isi.internalSquadUuid', '=', getKyselyUuid(squadUuid))
            .select(['n.id', 'n.uuid'])
            .distinct()
            .execute();
    }

    public async getSquadUsage(params: {
        squadUuid: string;
        start: Date;
        end: Date;
        minTotalBytes: number;
        limit: number;
        cursor?: number;
    }): Promise<{
        users: { id: number; totalBytes: number }[];
        nextCursor: string | null;
        hasMore: boolean;
    }> {
        const { squadUuid, start, end, minTotalBytes, limit, cursor } = params;

        const nodes = await this.getSquadNodesQuery(squadUuid);
        if (nodes.length === 0) {
            return { users: [], nextCursor: null, hasMore: false };
        }

        let qb = this.qb.kysely
            .selectFrom('internalSquadMembers as m')
            .innerJoin('nodesUserUsageHistory as h', 'h.userId', 'm.userId')
            .where('m.internalSquadUuid', '=', getKyselyUuid(squadUuid))
            .where('h.createdAt', '>=', start)
            .where('h.createdAt', '<=', end)
            .where(
                'h.nodeId',
                'in',
                nodes.map((node) => node.id),
            );

        if (cursor) {
            qb = qb.where('m.userId', '>', BigInt(cursor));
        }

        const rows = await qb
            .groupBy(['m.userId'])
            .having((eb) => eb(eb.fn.sum('h.totalBytes'), '>=', BigInt(minTotalBytes)))
            .select((eb) => ['m.userId as id', eb.fn.sum('h.totalBytes').as('totalBytes')])
            .orderBy('m.userId', 'asc')
            .limit(limit + 1)
            .execute();

        const hasMore = rows.length > limit;
        if (hasMore) {
            rows.pop();
        }

        return {
            users: rows.map((row) => ({
                id: Number(row.id),
                totalBytes: Number(row.totalBytes),
            })),
            nextCursor: hasMore ? String(rows[rows.length - 1].id) : null,
            hasMore,
        };
    }

    public async getUserSquadDailyUsage(params: {
        squadUuid: string;
        userId: bigint;
        start: Date;
        end: Date;
        dates: string[];
    }): Promise<{ date: string; nodes: { uuid: string; totalBytes: number }[] }[]> {
        const { squadUuid, userId, start, end, dates } = params;

        const nodes = await this.getSquadNodesQuery(squadUuid);
        if (nodes.length === 0) {
            return dates.map((date) => ({ date, nodes: [] }));
        }
        const nodeIds = nodes.map((node) => node.id);
        const uuidByNodeId = new Map(nodes.map((node) => [node.id, node.uuid]));

        const rows = await this.qb.kysely
            .selectFrom('nodesUserUsageHistory as h')
            .where('h.userId', '=', userId)
            .where('h.createdAt', '>=', start)
            .where('h.createdAt', '<=', end)
            .where('h.nodeId', 'in', nodeIds)
            .select((eb) => [
                sql<string>`to_char(${eb.ref('h.createdAt')}, 'YYYY-MM-DD')`.as('date'),
                'h.nodeId as nodeId',
                'h.totalBytes as totalBytes',
            ])
            .execute();

        const byDate = new Map<string, { uuid: string; totalBytes: number }[]>();
        for (const row of rows) {
            const bucket = byDate.get(row.date) ?? [];
            bucket.push({
                uuid: uuidByNodeId.get(row.nodeId)!,
                totalBytes: Number(row.totalBytes),
            });
            byDate.set(row.date, bucket);
        }

        return dates.map((date) => ({ date, nodes: byDate.get(date) ?? [] }));
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
        if (dto.length === 0) return true;

        const v = values(
            dto.map(({ uuid, viewPosition }) => ({
                uuid: sql<string>`${uuid}::uuid`,
                viewPosition: sql<number>`${viewPosition}::int`,
            })),
            'v',
        );

        await this.qb.kysely
            .updateTable('internalSquads')
            .from(v)
            .set((eb) => ({ viewPosition: eb.ref('v.viewPosition') }))
            .whereRef('internalSquads.uuid', '=', 'v.uuid')
            .execute();

        await this.prisma.tx
            .$executeRaw`SELECT setval('internal_squads_view_position_seq', (SELECT MAX(view_position) FROM internal_squads) + 1)`;

        return true;
    }

    public async removeManyUsersFromInternalSquad(
        squadUuid: string,
        usersIds: bigint[],
    ): Promise<void> {
        if (usersIds.length === 0) return;

        await this.qb.kysely
            .deleteFrom('internalSquadMembers')
            .where(
                'userId',
                'in',
                usersIds.map((userId) => userId),
            )
            .where('internalSquadUuid', '=', getKyselyUuid(squadUuid))
            .execute();
    }

    public async addManyUsersToInternalSquad(squadUuid: string, usersIds: bigint[]): Promise<void> {
        if (usersIds.length === 0) return;

        const records = usersIds.map((userId) => ({
            userId,
            internalSquadUuid: getKyselyUuid(squadUuid),
        }));

        await this.qb.kysely
            .insertInto('internalSquadMembers')
            .values(records)
            .onConflict((oc) => oc.columns(['userId', 'internalSquadUuid']).doNothing())
            .execute();
    }

    public async findAllTags(): Promise<string[]> {
        const result = await this.qb.kysely
            .selectFrom('internalSquads')
            .select(sql<string>`unnest(tags)`.as('tag'))
            .distinct()
            .where('tags', 'is not', null)
            .orderBy('tag')
            .execute();

        return result.map((value) => value.tag);
    }

    public async setTags(uuid: string, tags: string[]): Promise<string[]> {
        const result = await this.prisma.tx.internalSquads.update({
            where: { uuid },
            data: { tags },
            select: { tags: true },
        });

        return result.tags;
    }
}
