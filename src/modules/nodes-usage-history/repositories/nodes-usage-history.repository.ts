import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrudHistoricalRecords } from '@common/types/crud-port';

import { NodesUsageHistoryEntity } from '../entities/nodes-usage-history.entity';
import { NodesUsageHistoryConverter } from '../nodes-usage-history.converter';
import { IGet7DaysStats, IGetNodesUsageByRange } from '../interfaces';
import { Get7DaysStatsBuilder } from '../builders';

@Injectable()
export class NodesUsageHistoryRepository
    implements ICrudHistoricalRecords<NodesUsageHistoryEntity>
{
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: NodesUsageHistoryConverter,
    ) {}

    public async create(entity: NodesUsageHistoryEntity): Promise<NodesUsageHistoryEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.nodesUsageHistory.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async upsertUsageHistory(
        entity: NodesUsageHistoryEntity,
    ): Promise<NodesUsageHistoryEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.nodesUsageHistory.upsert({
            create: model,
            update: {
                downloadBytes: {
                    increment: model.downloadBytes,
                },
                uploadBytes: {
                    increment: model.uploadBytes,
                },
                totalBytes: {
                    increment: model.totalBytes,
                },
            },
            where: {
                nodeUuid_createdAt: {
                    nodeUuid: entity.nodeUuid,
                    createdAt: entity.createdAt,
                },
            },
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<NodesUsageHistoryEntity>,
    ): Promise<NodesUsageHistoryEntity[]> {
        const list = await this.prisma.tx.nodesUsageHistory.findMany({
            where: dto,
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async getStatsByDatetimeRange(start: Date, end: Date): Promise<bigint> {
        const result = await this.prisma.tx.nodesUsageHistory.aggregate({
            where: { createdAt: { gte: start, lte: end } },
            _sum: { totalBytes: true },
        });

        return result._sum.totalBytes ?? BigInt(0);
    }

    public async get7DaysStats(): Promise<IGet7DaysStats[]> {
        const { query } = new Get7DaysStatsBuilder();
        const result = await this.prisma.tx.$queryRaw<IGet7DaysStats[]>(query);
        return result;
    }

    public async getNodesUsageByRange(start: Date, end: Date): Promise<IGetNodesUsageByRange[]> {
        return await this.prisma.tx.$queryRaw<IGetNodesUsageByRange[]>`
            SELECT 
                n.uuid as "nodeUuid",
                n.name as "nodeName",
                n.country_code as "nodeCountryCode",
                COALESCE(SUM(h."total_bytes"), 0) as total,
                COALESCE(SUM(h."download_bytes"), 0) as "totalDownload",
                COALESCE(SUM(h."upload_bytes"), 0) as "totalUpload",
                DATE_TRUNC('day', h."created_at") as "date"
            FROM nodes n
            INNER JOIN "nodes_usage_history" h ON h."node_uuid" = n.uuid 
                AND h."created_at" >= ${start}
                AND h."created_at" <= ${end}
            GROUP BY n.uuid, n.name, n.country_code, DATE_TRUNC('day', h."created_at")
            ORDER BY "date" ASC
        `;
    }

    public async getSumLifetime(): Promise<string> {
        const result = await this.prisma.tx.nodesUsageHistory.aggregate({
            _sum: { totalBytes: true },
        });

        if (!result._sum.totalBytes) {
            return '0';
        }

        return result._sum.totalBytes.toString();
    }
}
