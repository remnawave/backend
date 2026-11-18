import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';
import { ExpressionBuilder, sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { DB } from 'prisma/generated/types';

import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { getKyselyUuid } from '@common/helpers';
import { values } from '@common/helpers/kysely/values';

import { IGetUniversalTopUser } from '@modules/nodes-user-usage-history/interfaces';

import { BulkUpsertInboundUsageHistoryBuilder } from '../builders/bulk-upsert-inbound-usage-history';
import { ConfigProfileConverter } from '../converters/config-profile.converter';
import { ConfigProfileInboundWithSquadsEntity } from '../entities';
import { ConfigProfileInboundEntity } from '../entities/config-profile-inbound.entity';
import { ConfigProfileWithInboundsAndNodesEntity } from '../entities/config-profile-with-inbounds-and-nodes.entity';
import { ConfigProfileEntity } from '../entities/config-profile.entity';

const SNIPPET_USAGE_JSONPATH = `$ ? (
    @.snippets[*] == $name
    || @.outbounds[*].snippet == $name
    || @.routing.rules[*].snippet == $name
    || @.routing.balancers[*].snippet == $name
)`;

@Injectable()
export class ConfigProfileRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly configProfileConverter: ConfigProfileConverter,
    ) {}

    public async create(
        entity: ConfigProfileEntity,
        inbounds: ConfigProfileInboundEntity[],
    ): Promise<{ uuid: string }> {
        const model = this.configProfileConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.configProfiles.create({
            select: {
                uuid: true,
            },
            data: {
                ...model,
                config: model.config as Prisma.InputJsonValue,
                configProfileInbounds: {
                    create: inbounds.map((inbound) => ({
                        ...inbound,
                    })),
                },
            },
        });

        return {
            uuid: result.uuid,
        };
    }

    public async findByUUID(uuid: string): Promise<ConfigProfileEntity | null> {
        const result = await this.prisma.tx.configProfiles.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.configProfileConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<ConfigProfileEntity>): Promise<ConfigProfileEntity> {
        const result = await this.prisma.tx.configProfiles.update({
            where: {
                uuid,
            },
            data: {
                ...data,
                config: data.config as Prisma.InputJsonValue,
            },
        });

        return this.configProfileConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<Omit<ConfigProfileEntity, 'tags'>>,
    ): Promise<ConfigProfileEntity[]> {
        const configProfileList = await this.prisma.tx.configProfiles.findMany({
            where: dto,
        });
        return this.configProfileConverter.fromPrismaModelsToEntities(configProfileList);
    }

    public async findFirstByCriteria(
        dto: Partial<Omit<ConfigProfileEntity, 'tags'>>,
    ): Promise<ConfigProfileEntity | null> {
        const result = await this.prisma.tx.configProfiles.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.configProfileConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.configProfiles.delete({ where: { uuid } });
        return !!result;
    }

    public async getTotalConfigProfiles(): Promise<number> {
        return await this.prisma.tx.configProfiles.count();
    }

    public async getAllConfigProfiles(): Promise<ConfigProfileWithInboundsAndNodesEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfiles')
            .selectAll('configProfiles')
            .orderBy('configProfiles.viewPosition', 'asc')
            .select((eb) => [
                // inbounds
                this.includeInbounds(eb),
                // nodes
                this.includeNodes(eb),
            ])
            .execute();

        return result.map((item) => new ConfigProfileWithInboundsAndNodesEntity(item));
    }

    public async getUuidsBySnippetName(name: string): Promise<string[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfiles')
            .select('configProfiles.uuid')
            .where(
                sql<boolean>`jsonb_path_exists(
                    ${sql.ref('config_profiles.config')},
                    ${SNIPPET_USAGE_JSONPATH}::jsonpath,
                    jsonb_build_object('name', ${name}::text)
                )`,
            )
            .orderBy('configProfiles.viewPosition', 'asc')
            .execute();

        return result.map((row) => row.uuid);
    }

    public async getConfigProfileByUUID(
        uuid: string,
    ): Promise<ConfigProfileWithInboundsAndNodesEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('configProfiles')
            .selectAll('configProfiles')
            .where('configProfiles.uuid', '=', getKyselyUuid(uuid))
            .select((eb) => [
                // inbounds
                this.includeInbounds(eb),
                // nodes
                this.includeNodes(eb),
            ])
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new ConfigProfileWithInboundsAndNodesEntity(result);
    }

    public async createManyConfigProfileInbounds(inbounds: ConfigProfileInboundEntity[]): Promise<{
        count: number;
    }> {
        const result = await this.prisma.tx.configProfileInbounds.createMany({
            data: inbounds.map((inbound) => ({
                ...inbound,
                rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
            })),
        });

        return {
            count: result.count,
        };
    }

    public async deleteManyConfigProfileInboundsByUUIDs(uuids: string[]): Promise<{
        count: number;
    }> {
        const result = await this.prisma.tx.configProfileInbounds.deleteMany({
            where: { uuid: { in: uuids } },
        });

        return {
            count: result.count,
        };
    }

    public async updateConfigProfileInbound(
        inbound: ConfigProfileInboundEntity,
    ): Promise<ConfigProfileInboundEntity> {
        const result = await this.prisma.tx.configProfileInbounds.update({
            where: { uuid: inbound.uuid },
            data: {
                ...inbound,
                rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
            },
        });

        return new ConfigProfileInboundEntity(result);
    }

    public async findNodeUuidsByInboundUuids(
        inboundUuids: string[],
    ): Promise<Map<string, string[]>> {
        const map = new Map<string, string[]>();
        if (inboundUuids.length === 0) return map;

        const rows = await this.qb.kysely
            .selectFrom('configProfileInboundsToNodes')
            .where(
                'configProfileInboundsToNodes.configProfileInboundUuid',
                'in',
                inboundUuids.map((uuid) => getKyselyUuid(uuid)),
            )
            .select(['configProfileInboundUuid', 'nodeUuid'])
            .execute();

        for (const row of rows) {
            const list = map.get(row.configProfileInboundUuid);
            if (list) {
                list.push(row.nodeUuid);
            } else {
                map.set(row.configProfileInboundUuid, [row.nodeUuid]);
            }
        }

        return map;
    }

    public async bulkUpsertInboundUsageHistory(
        list: { inboundUuid: string; userId: string; totalBytes: string }[],
    ): Promise<void> {
        const { query } = new BulkUpsertInboundUsageHistoryBuilder(list);
        await this.prisma.tx.$queryRaw(query);
    }

    public async getInboundUsage(params: {
        inboundUuid: string;
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
        const { inboundUuid, start, end, minTotalBytes, limit, cursor } = params;

        let qb = this.qb.kysely
            .selectFrom('userInboundUsageHistory as h')
            .where('h.inboundUuid', '=', getKyselyUuid(inboundUuid))
            .where('h.createdAt', '>=', start)
            .where('h.createdAt', '<=', end);

        if (cursor) {
            qb = qb.where('h.userId', '>', BigInt(cursor));
        }

        const rows = await qb
            .groupBy(['h.userId'])
            .having((eb) => eb(eb.fn.sum('h.totalBytes'), '>=', BigInt(minTotalBytes)))
            .select((eb) => ['h.userId as id', eb.fn.sum('h.totalBytes').as('totalBytes')])
            .orderBy('h.userId', 'asc')
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
            nextCursor: hasMore ? rows[rows.length - 1].id.toString() : null,
            hasMore,
        };
    }

    public async getInboundTopUsersUsage(params: {
        inboundUuid: string;
        start: Date;
        end: Date;
        limit: number;
    }): Promise<IGetUniversalTopUser[]> {
        const { inboundUuid, start, end, limit } = params;

        return await this.qb.kysely
            .selectFrom('userInboundUsageHistory as h')
            .innerJoin('users as u', 'u.id', 'h.userId')
            .where('h.inboundUuid', '=', getKyselyUuid(inboundUuid))
            .where('h.createdAt', '>=', start)
            .where('h.createdAt', '<=', end)
            .select([
                'u.id as userId',
                'u.username',
                (eb) => eb.fn.sum<bigint>('h.totalBytes').as('total'),
            ])
            .groupBy(['u.id', 'u.username'])
            .orderBy((eb) => eb.fn.sum<bigint>('h.totalBytes'), 'desc')
            .limit(limit)
            .execute();
    }

    public async getInboundDailyTrafficSum(
        inboundUuid: string,
        start: Date,
        end: Date,
        dates: string[],
    ): Promise<number[]> {
        const query = Prisma.sql`
        WITH daily_traffic AS (
            SELECT
                created_at::date AS date,
                SUM(total_bytes) AS bytes
            FROM user_inbound_usage_history
            WHERE
                inbound_uuid = ${inboundUuid}::uuid
                AND created_at >= ${start}::date
                AND created_at <= ${end}::date
            GROUP BY created_at
        )
        SELECT
            COALESCE(dt.bytes, 0) AS value
        FROM unnest(${dates}::date[]) WITH ORDINALITY AS d(date, ord)
        LEFT JOIN daily_traffic dt ON dt.date = d.date::date
        ORDER BY d.ord;
    `;

        const result = await this.prisma.tx.$queryRaw<Array<{ value: bigint }>>(query);
        return result.map((item) => Number(item.value));
    }

    public async getInboundUserDailyUsage(params: {
        inboundUuid: string;
        userId: bigint;
        start: Date;
        end: Date;
        dates: string[];
    }): Promise<{ date: string; totalBytes: number }[]> {
        const { inboundUuid, userId, start, end, dates } = params;

        const rows = await this.qb.kysely
            .selectFrom('userInboundUsageHistory as h')
            .where('h.inboundUuid', '=', getKyselyUuid(inboundUuid))
            .where('h.userId', '=', userId)
            .where('h.createdAt', '>=', start)
            .where('h.createdAt', '<=', end)
            .select((eb) => [
                sql<string>`to_char(${eb.ref('h.createdAt')}, 'YYYY-MM-DD')`.as('date'),
                'h.totalBytes as totalBytes',
            ])
            .execute();

        const byDate = new Map(rows.map((row) => [row.date, Number(row.totalBytes)]));

        return dates.map((date) => ({ date, totalBytes: byDate.get(date) ?? 0 }));
    }

    public async getInboundsByProfileUuid(
        profileUuid: string,
    ): Promise<ConfigProfileInboundEntity[]> {
        const result = await this.prisma.tx.configProfileInbounds.findMany({
            where: { profileUuid },
        });

        return result.map((item) => new ConfigProfileInboundEntity(item));
    }

    public async getInboundsWithSquadsByProfileUuid(
        profileUuid: string,
    ): Promise<ConfigProfileInboundWithSquadsEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfileInbounds')
            .where('configProfileInbounds.profileUuid', '=', getKyselyUuid(profileUuid))
            .selectAll('configProfileInbounds')
            .select((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('internalSquadInbounds')
                        .select(['internalSquadInbounds.internalSquadUuid as uuid'])
                        .whereRef(
                            'internalSquadInbounds.inboundUuid',
                            '=',
                            'configProfileInbounds.uuid',
                        ),
                ).as('activeSquads'),
            ])
            .execute();

        return result.map((item) => new ConfigProfileInboundWithSquadsEntity(item));
    }

    public async getAllInbounds(): Promise<ConfigProfileInboundWithSquadsEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfileInbounds')
            .selectAll('configProfileInbounds')
            .select((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('internalSquadInbounds')
                        .select(['internalSquadInbounds.internalSquadUuid as uuid'])
                        .whereRef(
                            'internalSquadInbounds.inboundUuid',
                            '=',
                            'configProfileInbounds.uuid',
                        ),
                ).as('activeSquads'),
            ])
            .execute();

        return result.map((item) => new ConfigProfileInboundWithSquadsEntity(item));
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
            .updateTable('configProfiles')
            .from(v)
            .set((eb) => ({ viewPosition: eb.ref('v.viewPosition') }))
            .whereRef('configProfiles.uuid', '=', 'v.uuid')
            .execute();

        await this.prisma.tx
            .$executeRaw`SELECT setval('config_profiles_view_position_seq', (SELECT MAX(view_position) FROM config_profiles) + 1)`;

        return true;
    }

    /*

    Kysely helpers

    */

    private includeInbounds(eb: ExpressionBuilder<DB, 'configProfiles'>) {
        return jsonArrayFrom(
            eb
                .selectFrom('configProfileInbounds')
                .selectAll('configProfileInbounds')
                .whereRef('configProfileInbounds.profileUuid', '=', 'configProfiles.uuid'),
        ).as('inbounds');
    }

    private includeNodes(eb: ExpressionBuilder<DB, 'configProfiles'>) {
        return jsonArrayFrom(
            eb
                .selectFrom('nodes')
                .select(['uuid', 'name', 'countryCode'])
                .orderBy('nodes.viewPosition', 'asc')
                .whereRef('nodes.activeConfigProfileUuid', '=', 'configProfiles.uuid'),
        ).as('nodes');
    }

    public async findAllTags(): Promise<string[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfiles')
            .select(sql<string>`unnest(tags)`.as('tag'))
            .distinct()
            .where('tags', 'is not', null)
            .orderBy('tag')
            .execute();

        return result.map((value) => value.tag);
    }

    public async setTags(uuid: string, tags: string[]): Promise<string[]> {
        const result = await this.prisma.tx.configProfiles.update({
            where: { uuid },
            data: { tags },
            select: { tags: true },
        });

        return result.tags;
    }
}
