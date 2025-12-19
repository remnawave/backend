import { Prisma } from '@prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database/tx-kysely.service';
import { ICrudHistoricalRecords } from '@common/types/crud-port';

import { IGetNodesUsageByRange } from '@modules/nodes-usage-history/interfaces';

import {
    IGetNodesRealtimeUsage,
    IGetLegacyStatsNodesUsersUsage,
    IGetUniversalTopNode,
    IGetUniversalSeries,
    IGetLegacyStatsUserUsage,
    IGetUniversalTopUser,
} from '../interfaces';
import { GetNodeUsersUsageByRangeBuilder } from '../builders/get-node-users-usage-by-range/get-node-users-usage-by-range.builder';
import { BulkUpsertHistoryEntryBuilder } from '../builders/bulk-upsert-history-entry/bulk-upsert-history-entry.builder';
import { GetNodesRealtimeUsageBuilder } from '../builders/get-nodes-realtime-usage/get-nodes-realtime-usage.builder';
import { GetUserUsageByRangeBuilder } from '../builders/get-user-usage-by-range/get-user-usage-by-range.builder';
import { NodesUserUsageHistoryEntity } from '../entities/nodes-user-usage-history.entity';
import { NodesUserUsageHistoryConverter } from '../nodes-user-usage-history.converter';

@Injectable()
export class NodesUserUsageHistoryRepository implements ICrudHistoricalRecords<NodesUserUsageHistoryEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly converter: NodesUserUsageHistoryConverter,
    ) {}

    public async create(entity: NodesUserUsageHistoryEntity): Promise<NodesUserUsageHistoryEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.nodesUserUsageHistory.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<NodesUserUsageHistoryEntity>,
    ): Promise<NodesUserUsageHistoryEntity[]> {
        const list = await this.prisma.tx.nodesUserUsageHistory.findMany({
            where: dto,
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async bulkUpsertUsageHistory(
        userUsageHistoryList: NodesUserUsageHistoryEntity[],
    ): Promise<void> {
        const { query } = new BulkUpsertHistoryEntryBuilder(userUsageHistoryList);
        await this.prisma.tx.$executeRaw<void>(query);
    }

    /**
     * @deprecated This method is deprecated and may be removed in future versions.
     */
    public async getLegacyStatsUserUsage(
        tId: bigint,
        start: Date,
        end: Date,
    ): Promise<IGetLegacyStatsUserUsage[]> {
        const { query } = new GetUserUsageByRangeBuilder(tId, start, end);
        const result = await this.prisma.tx.$queryRaw<IGetLegacyStatsUserUsage[]>(query);
        return result;
    }

    /**
     * @deprecated This method is deprecated and may be removed in future versions.
     */
    public async getNodeUsersUsageByRange(
        nodeUuid: string,
        start: Date,
        end: Date,
    ): Promise<IGetLegacyStatsNodesUsersUsage[]> {
        const nodeId = await this.prisma.tx.nodes.findFirstOrThrow({
            select: {
                id: true,
                uuid: true,
            },
            where: {
                uuid: nodeUuid,
            },
        });
        const { query } = new GetNodeUsersUsageByRangeBuilder(nodeId.id, start, end);
        const result = await this.prisma.tx.$queryRaw<IGetLegacyStatsNodesUsersUsage[]>(query);
        return result;
    }

    public async getNodesRealtimeUsage(): Promise<IGetNodesRealtimeUsage[]> {
        const { query } = new GetNodesRealtimeUsageBuilder();
        const result = await this.prisma.tx.$queryRaw<IGetNodesRealtimeUsage[]>(query);
        return result;
    }

    public async cleanOldUsageRecords(): Promise<number> {
        const query = Prisma.sql`
            DELETE FROM nodes_user_usage_history
            WHERE created_at < NOW() - INTERVAL '14 days'
        `;

        return await this.prisma.tx.$executeRaw<number>(query);
    }

    public async vacuumTable(): Promise<void> {
        const query = Prisma.sql`
            VACUUM nodes_user_usage_history;
        `;

        const queryReindex = Prisma.sql`
            REINDEX TABLE nodes_user_usage_history;
        `;

        await this.prisma.tx.$executeRaw<void>(query);
        await this.prisma.tx.$executeRaw<void>(queryReindex);
    }

    public async truncateTable(): Promise<void> {
        const query = Prisma.sql`
            TRUNCATE nodes_user_usage_history;
        `;

        await this.prisma.tx.$executeRaw<void>(query);
    }

    public async getUserNodesUsageByRange(
        userId: bigint,
        start: Date,
        end: Date,
        dates: string[],
    ): Promise<IGetNodesUsageByRange[]> {
        const query = Prisma.sql`
            WITH daily_usage AS (
                SELECT
                    n.uuid,
                    n.name,
                    n.country_code,
                    nuh.created_at::date AS date,
                    SUM(nuh.total_bytes) AS bytes
                FROM nodes n
                INNER JOIN nodes_user_usage_history nuh ON nuh.node_id = n.id
                WHERE
                    nuh.user_id = ${userId}
                    AND nuh.created_at >= ${start}::date
                    AND nuh.created_at <= ${end}::date
                GROUP BY n.uuid, n.name, n.country_code, nuh.created_at
            ),
            nodes_with_totals AS (
                SELECT
                    uuid,
                    name,
                    country_code,
                    SUM(bytes) AS total_bytes
                FROM daily_usage
                GROUP BY uuid, name, country_code
            )
            SELECT
                nt.uuid as "uuid",
                nt.name as "name",
                nt.country_code as "countryCode",
                nt.total_bytes as "total",
                ARRAY_AGG(
                    COALESCE(du.bytes, 0)
                    ORDER BY d.ord
                ) AS "data"
            FROM nodes_with_totals nt
            CROSS JOIN unnest(${dates}::date[]) WITH ORDINALITY AS d(date, ord)
            LEFT JOIN daily_usage du
                ON du.uuid = nt.uuid
                AND du.date = d.date::date
            GROUP BY nt.uuid, nt.name, nt.country_code, nt.total_bytes
            ORDER BY nt.total_bytes DESC;
        `;

        return await this.prisma.tx.$queryRaw<IGetUniversalSeries[]>(query);
    }

    public async getTopUserNodesByTraffic(
        userId: bigint,
        start: Date,
        end: Date,
        limit: number = 5,
    ): Promise<IGetUniversalTopNode[]> {
        return await this.qb.kysely
            .selectFrom('nodes as n')
            .innerJoin('nodesUserUsageHistory as nuh', 'nuh.nodeId', 'n.id')
            .select([
                'n.uuid',
                'n.name',
                'n.countryCode',
                (eb) => eb.fn.sum<bigint>('nuh.totalBytes').as('total'),
            ])
            .where('nuh.userId', '=', userId)
            .where('nuh.createdAt', '>=', start)
            .where('nuh.createdAt', '<=', end)
            .groupBy(['n.uuid', 'n.name', 'n.countryCode'])
            .orderBy((eb) => eb.fn.sum<bigint>('nuh.totalBytes'), 'desc')
            .limit(limit)
            .execute();
    }

    public async getUserDailyTrafficSum(
        userId: bigint,
        start: Date,
        end: Date,
        dates: string[],
    ): Promise<number[]> {
        const query = Prisma.sql`
            WITH daily_traffic AS (
                SELECT 
                    created_at::date AS date,
                    SUM(total_bytes) AS bytes
                FROM nodes_user_usage_history
                WHERE 
                    user_id = ${userId}
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

    public async getTopNodeUsersByTraffic(
        nodeId: bigint,
        start: Date,
        end: Date,
        limit: number = 5,
    ): Promise<IGetUniversalTopUser[]> {
        return await this.qb.kysely
            .selectFrom('users as u')
            .innerJoin('nodesUserUsageHistory as nuh', 'nuh.userId', 'u.tId')
            .select([
                'u.uuid',
                'u.username',
                (eb) => eb.fn.sum<bigint>('nuh.totalBytes').as('total'),
            ])
            .where('nuh.nodeId', '=', nodeId)
            .where('nuh.createdAt', '>=', start)
            .where('nuh.createdAt', '<=', end)
            .groupBy(['u.uuid', 'u.username'])
            .orderBy((eb) => eb.fn.sum<bigint>('nuh.totalBytes'), 'desc')
            .limit(limit)
            .execute();
    }

    public async getNodeDailyTrafficSum(
        nodeId: bigint,
        start: Date,
        end: Date,
        dates: string[],
    ): Promise<number[]> {
        const query = Prisma.sql`
        WITH daily_traffic AS (
            SELECT 
                created_at::date AS date,
                SUM(total_bytes) AS bytes
            FROM nodes_user_usage_history
            WHERE 
                node_id = ${nodeId}
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
}
