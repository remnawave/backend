import { sql } from 'kysely';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { paginateQuery } from '@common/helpers';
import { GetTorrentBlockerReportsCommand } from '@libs/contracts/commands/node-plugins/torrent-blocker';

import {
    IGetTopTorrentBlockerNode,
    IGetTopTorrentBlockerUser,
} from '../interfaces/tb-stats.interface';
import { BaseTorrentBlockerReportEntity, ExtendedTorrentBlockerReportEntity } from '../entities';
import { TorrentBlockerReportConverter } from '../torrent-blocker-report.converter';
import { ITorrentBlockerReportsStats } from '../models';

const FILTER_COLUMN_MAP = {
    id: sql.ref('torrent_blocker_reports.id'),
    userId: sql.ref('torrent_blocker_reports.user_id'),
    nodeId: sql.ref('torrent_blocker_reports.node_id'),
    createdAt: sql.ref('torrent_blocker_reports.created_at'),
    'user.username': sql.ref('users.username'),
    'user.uuid': sql.ref('users.uuid'),
    'node.uuid': sql.ref('nodes.uuid'),
    'node.name': sql.ref('nodes.name'),
    'report.actionReport.ip': sql`report->'actionReport'->>'ip'`,
    'report.xrayReport.inboundTag': sql`report->'xrayReport'->>'inboundTag'`,
    'report.xrayReport.outboundTag': sql`report->'xrayReport'->>'outboundTag'`,
    'report.xrayReport.protocol': sql`report->'xrayReport'->>'protocol'`,
} as const;

const SORT_COLUMN_MAP: Record<string, string> = {
    'user.username': 'users.username',
    'user.uuid': 'users.uuid',
    'node.uuid': 'nodes.uuid',
    'node.name': 'nodes.name',
    id: 'torrent_blocker_reports.id',
    createdAt: 'torrent_blocker_reports.created_at',
};

type AllowedFilterId = keyof typeof FILTER_COLUMN_MAP;

@Injectable()
export class TorrentBlockerReportsRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: TorrentBlockerReportConverter,
        private readonly qb: TxKyselyService,
    ) {}

    private get baseQb() {
        return this.qb.kysely
            .selectFrom('torrentBlockerReports')
            .innerJoin('users', 'users.tId', 'torrentBlockerReports.userId')
            .innerJoin('nodes', 'nodes.id', 'torrentBlockerReports.nodeId')
            .select([
                'torrentBlockerReports.id',
                'torrentBlockerReports.userId',
                'torrentBlockerReports.nodeId',
                'torrentBlockerReports.report',
                'torrentBlockerReports.createdAt',
                'users.uuid as userUuid',
                'users.username',
                'nodes.uuid as nodeUuid',
                'nodes.name as nodeName',
                'nodes.countryCode',
            ]);
    }

    public async create(
        entity: BaseTorrentBlockerReportEntity,
    ): Promise<BaseTorrentBlockerReportEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.torrentBlockerReports.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async getAllReports({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetTorrentBlockerReportsCommand.RequestQuery): Promise<
        [ExtendedTorrentBlockerReportEntity[], number]
    > {
        let qb = this.baseQb;

        if (filters?.length) {
            qb = this.applyFilters(qb, filters, filterModes);
        }

        if (sorting?.length) {
            for (const sort of sorting) {
                const sortColumn = SORT_COLUMN_MAP[sort.id] ?? sort.id;
                qb = qb.orderBy(sql.ref(sortColumn), (ob) =>
                    (sort.desc ? ob.desc() : ob.asc()).nullsLast(),
                ) as typeof qb;
            }
        } else {
            qb = qb.orderBy(sql.ref('torrentBlockerReports.id'), (ob) => ob.desc().nullsLast());
        }

        const { rows, count } = await paginateQuery(qb, { offset: start, limit: size });

        return [
            rows.map(
                (r) =>
                    new ExtendedTorrentBlockerReportEntity(
                        {
                            id: r.id,
                            userId: r.userId,
                            nodeId: r.nodeId,
                            report: r.report,
                            createdAt: r.createdAt,
                        },
                        {
                            username: r.username,
                            uuid: r.userUuid,
                        },
                        {
                            name: r.nodeName,
                            uuid: r.nodeUuid,
                            countryCode: r.countryCode,
                        },
                    ),
            ),
            count,
        ];
    }

    private applyFilters(
        qb: typeof this.baseQb,
        filters: GetTorrentBlockerReportsCommand.RequestQuery['filters'],
        filterModes?: GetTorrentBlockerReportsCommand.RequestQuery['filterModes'],
    ) {
        for (const filter of filters ?? []) {
            if (!(filter.id in FILTER_COLUMN_MAP)) {
                continue;
            }

            const column = FILTER_COLUMN_MAP[filter.id as AllowedFilterId];
            const mode = filterModes?.[filter.id] ?? 'contains';

            if (filter.id === 'createdAt') {
                qb = qb.where(column, '=', new Date(filter.value as string));
                continue;
            }

            const BIGINT_FILTER_IDS: readonly string[] = ['id', 'userId', 'nodeId'] as const;

            if (BIGINT_FILTER_IDS.includes(filter.id)) {
                try {
                    BigInt(filter.value as string);
                    qb = qb.where(
                        sql`CAST(${FILTER_COLUMN_MAP[filter.id as AllowedFilterId]} AS TEXT)`,
                        'like',
                        `%${filter.value}%`,
                    );
                } catch {
                    qb = qb.where('torrentBlockerReports.id', 'is', null);
                }
                continue;
            }

            if (filter.id === 'user.uuid' || filter.id === 'node.uuid') {
                const ref = FILTER_COLUMN_MAP[filter.id as AllowedFilterId];
                qb = qb.where(sql`${ref}::text`, 'ilike', `%${filter.value}%`);
                continue;
            }

            switch (mode) {
                case 'equals':
                    qb = qb.where(
                        FILTER_COLUMN_MAP[filter.id as AllowedFilterId],
                        '=',
                        filter.value,
                    );
                    break;
                default:
                    qb = qb.where(
                        FILTER_COLUMN_MAP[filter.id as AllowedFilterId],
                        'ilike',
                        `%${filter.value}%`,
                    );
            }
        }

        return qb;
    }

    public async truncateReports(): Promise<void> {
        await this.prisma.tx.$executeRaw`TRUNCATE torrent_blocker_reports RESTART IDENTITY;`;
        return;
    }

    public async getStats(): Promise<ITorrentBlockerReportsStats> {
        const stats = await this.qb.kysely
            .selectFrom('torrentBlockerReports')
            .select([
                sql<bigint>`COUNT(*)`.as('totalReports'),
                sql<bigint>`COUNT(DISTINCT user_id)`.as('distinctUsers'),
                sql<bigint>`COUNT(DISTINCT node_id)`.as('distinctNodes'),
                sql<bigint>`COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours')`.as(
                    'reportsLast24Hours',
                ),
            ])
            .executeTakeFirstOrThrow();

        return {
            distinctNodes: Number(stats.distinctNodes),
            distinctUsers: Number(stats.distinctUsers),
            totalReports: Number(stats.totalReports),
            reportsLast24Hours: Number(stats.reportsLast24Hours),
        };
    }

    public async getTopTorrentBlockerUsers(): Promise<IGetTopTorrentBlockerUser[]> {
        return await this.qb.kysely
            .selectFrom('torrentBlockerReports')
            .innerJoin('users', 'users.tId', 'torrentBlockerReports.userId')
            .select(['users.uuid', 'users.username', sql<bigint>`COUNT(*)`.as('total')])
            .groupBy(['users.uuid', 'users.username'])
            .orderBy('total', 'desc')
            .limit(150)
            .execute();
    }

    public async getTopTorrentBlockerNodes(): Promise<IGetTopTorrentBlockerNode[]> {
        return await this.qb.kysely
            .selectFrom('torrentBlockerReports')
            .innerJoin('nodes', 'nodes.id', 'torrentBlockerReports.nodeId')
            .select([
                'nodes.uuid',
                'nodes.name',
                'nodes.countryCode',
                sql<bigint>`COUNT(*)`.as('total'),
            ])
            .groupBy(['nodes.uuid', 'nodes.name', 'nodes.countryCode'])
            .orderBy('total', 'desc')
            .limit(150)
            .execute();
    }
}
