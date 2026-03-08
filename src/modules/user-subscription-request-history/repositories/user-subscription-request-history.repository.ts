import { sql } from 'kysely';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { getKyselyUuid, paginateQuery } from '@common/helpers';
import { ICrudWithId } from '@common/types/crud-port';
import { TxKyselyService } from '@common/database';
import { GetSubscriptionRequestHistoryCommand } from '@libs/contracts/commands';

import { UserSubscriptionRequestHistoryEntity } from '../entities/user-subscription-request-history.entity';
import { UserSubscriptionRequestHistoryConverter } from '../user-subscription-request-history.converter';

const SUB_HISTORY_FILTER_COLUMN_MAP = {
    id: sql`CAST(id AS TEXT)`,
    requestAt: sql.ref('user_subscription_request_history.request_at'),
    requestIp: sql.ref('user_subscription_request_history.request_ip'),
    userUuid: sql`"user_uuid"::text`,
    userAgent: sql.ref('user_subscription_request_history.user_agent'),
} as const;

type AllowedSubHistoryFilterId = keyof typeof SUB_HISTORY_FILTER_COLUMN_MAP;

@Injectable()
export class UserSubscriptionRequestHistoryRepository implements ICrudWithId<UserSubscriptionRequestHistoryEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: UserSubscriptionRequestHistoryConverter,
        private readonly qb: TxKyselyService,
    ) {}

    public async create(
        entity: UserSubscriptionRequestHistoryEntity,
    ): Promise<UserSubscriptionRequestHistoryEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.userSubscriptionRequestHistory.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<UserSubscriptionRequestHistoryEntity>,
    ): Promise<UserSubscriptionRequestHistoryEntity[]> {
        const list = await this.prisma.tx.userSubscriptionRequestHistory.findMany({
            where: dto,
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async findById(
        id: bigint | number,
    ): Promise<UserSubscriptionRequestHistoryEntity | null> {
        const result = await this.prisma.tx.userSubscriptionRequestHistory.findUnique({
            where: { id },
        });
        if (!result) {
            return null;
        }

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async update(
        entity: UserSubscriptionRequestHistoryEntity,
    ): Promise<UserSubscriptionRequestHistoryEntity | null> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.userSubscriptionRequestHistory.update({
            where: { id: entity.id },
            data: model,
        });
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async deleteById(id: bigint | number): Promise<boolean> {
        const result = await this.prisma.tx.userSubscriptionRequestHistory.delete({
            where: { id },
        });
        return !!result;
    }

    public async countByUserUuid(userUuid: string): Promise<number> {
        const result = await this.prisma.tx.userSubscriptionRequestHistory.count({
            where: { userUuid },
        });
        return result;
    }

    public async findOldestByUserUuid(
        userUuid: string,
    ): Promise<UserSubscriptionRequestHistoryEntity | null> {
        const result = await this.prisma.tx.userSubscriptionRequestHistory.findFirst({
            where: { userUuid },
            orderBy: { requestAt: 'asc' },
        });
        return result ? this.converter.fromPrismaModelToEntity(result) : null;
    }

    public async findByUserUuid(userUuid: string): Promise<UserSubscriptionRequestHistoryEntity[]> {
        const result = await this.prisma.tx.userSubscriptionRequestHistory.findMany({
            where: { userUuid },
            orderBy: { requestAt: 'desc' },
        });
        return this.converter.fromPrismaModelsToEntities(result);
    }

    public async getAllSubscriptionRequestHistory({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetSubscriptionRequestHistoryCommand.RequestQuery): Promise<
        [UserSubscriptionRequestHistoryEntity[], number]
    > {
        let qb = this.qb.kysely.selectFrom('userSubscriptionRequestHistory').selectAll();

        if (filters?.length) {
            qb = this.applySubHistoryFilters(qb, filters, filterModes);
        }

        if (sorting?.length) {
            for (const sort of sorting) {
                qb = qb.orderBy(sql.ref(sort.id), (ob) =>
                    (sort.desc ? ob.desc() : ob.asc()).nullsLast(),
                ) as typeof qb;
            }
        } else {
            qb = qb.orderBy('requestAt', 'desc');
        }

        const { rows, count } = await paginateQuery(qb, { offset: start, limit: size });

        return [rows.map((u) => new UserSubscriptionRequestHistoryEntity(u)), count];
    }

    private applySubHistoryFilters(
        qb: any,
        filters: GetSubscriptionRequestHistoryCommand.RequestQuery['filters'],
        filterModes?: GetSubscriptionRequestHistoryCommand.RequestQuery['filterModes'],
    ) {
        for (const filter of filters ?? []) {
            if (!(filter.id in SUB_HISTORY_FILTER_COLUMN_MAP)) continue;

            const column = SUB_HISTORY_FILTER_COLUMN_MAP[filter.id as AllowedSubHistoryFilterId];
            const mode = filterModes?.[filter.id] ?? 'contains';

            if (filter.id === 'requestAt') {
                qb = qb.where(column, '=', new Date(filter.value as string));
                continue;
            }

            if (filter.id === 'id') {
                try {
                    BigInt(filter.value as string);
                    qb = qb.where(column, 'like', `%${filter.value}%`);
                } catch {
                    qb = qb.where('id', 'is', null);
                }
                continue;
            }

            switch (mode) {
                case 'equals':
                    qb = qb.where(column, '=', filter.value);
                    break;
                case 'startsWith':
                    qb = qb.where(column, 'ilike', `${filter.value}%`);
                    break;
                case 'endsWith':
                    qb = qb.where(column, 'ilike', `%${filter.value}`);
                    break;
                default:
                    qb = qb.where(column, 'ilike', `%${filter.value}%`);
            }
        }

        return qb;
    }

    public async getSubscriptionRequestHistoryStats(): Promise<{
        byParsedApp: { app: string; count: number }[];
    }> {
        const appExtraction = sql<string>`
        CASE 
            WHEN POSITION('/' IN user_agent) > 0 THEN 
                SPLIT_PART(user_agent, '/', 1)
            ELSE 
                SPLIT_PART(user_agent, ' ', 1)
        END
    `;

        const appStats = await this.qb.kysely
            .selectFrom('userSubscriptionRequestHistory')
            .select([appExtraction.as('app'), (eb) => eb.fn.count('id').as('count')])
            .where('userAgent', 'is not', null)
            .groupBy(appExtraction)
            .orderBy('count', 'desc')
            .execute();

        return {
            byParsedApp: appStats.map((stat) => ({
                app: stat.app,
                count: Number(stat.count),
            })),
        };
    }

    public async cleanupUserRecords(userUuid: string, keepLatest: number): Promise<number> {
        const result = await this.qb.kysely
            .deleteFrom('userSubscriptionRequestHistory')
            .where('userUuid', '=', getKyselyUuid(userUuid))
            .where('id', 'not in', (eb) =>
                eb
                    .selectFrom('userSubscriptionRequestHistory')
                    .select('id')
                    .where('userUuid', '=', getKyselyUuid(userUuid))
                    .orderBy('requestAt', 'desc')
                    .limit(keepLatest),
            )
            .execute();

        return result.length;
    }

    public async getHourlyRequestStats(): Promise<{ dateTime: Date; requestCount: number }[]> {
        const result = await this.qb.kysely
            .selectFrom('userSubscriptionRequestHistory')
            .select([
                sql<Date>`date_trunc('hour', request_at)`.as('hour'),
                (eb) => eb.fn.count('id').as('requestCount'),
            ])
            .where('requestAt', '>=', sql<Date>`NOW() - INTERVAL '48 hours'`)
            .groupBy(sql`date_trunc('hour', request_at)`)
            .orderBy('hour')
            .execute();

        return result.map((row) => ({
            dateTime: row.hour,
            requestCount: Number(row.requestCount),
        }));
    }
}
