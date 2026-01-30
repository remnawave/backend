import { sql } from 'kysely';

import { PrismaClient } from '@generated/prisma/client';
import { DB } from 'prisma/generated/types';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrudWithId } from '@common/types/crud-port';
import { TxKyselyService } from '@common/database';
import { getKyselyUuid } from '@common/helpers';
import { GetSubscriptionRequestHistoryCommand } from '@libs/contracts/commands';

import { UserSubscriptionRequestHistoryEntity } from '../entities/user-subscription-request-history.entity';
import { UserSubscriptionRequestHistoryConverter } from '../user-subscription-request-history.converter';

@Injectable()
export class UserSubscriptionRequestHistoryRepository implements ICrudWithId<UserSubscriptionRequestHistoryEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
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
        const qb = this.qb.kysely.selectFrom('userSubscriptionRequestHistory');

        let isFiltersEmpty = true;

        let whereBuilder = qb;

        if (filters?.length) {
            isFiltersEmpty = false;
            for (const filter of filters) {
                const mode = filterModes?.[filter.id] || 'contains';

                if (['requestAt'].includes(filter.id)) {
                    whereBuilder = whereBuilder.where(
                        filter.id as any,
                        '=',
                        new Date(filter.value as string),
                    );
                    continue;
                }

                if (filter.id === 'id') {
                    try {
                        const searchValue = filter.value as string;
                        BigInt(searchValue);

                        whereBuilder = whereBuilder.where(
                            sql`CAST(id AS TEXT)`,
                            'like',
                            `%${searchValue}%`,
                        );
                    } catch {
                        whereBuilder = whereBuilder.where('id', 'is', null);
                    }
                    continue;
                }

                const field = filter.id as keyof DB['userSubscriptionRequestHistory'];

                switch (mode) {
                    default: // 'contains'
                        if (field === 'userUuid') {
                            whereBuilder = whereBuilder.where(
                                sql`"user_uuid"::text`,
                                'ilike',
                                `%${filter.value}%`,
                            );
                        } else {
                            whereBuilder = whereBuilder.where(field, 'ilike', `%${filter.value}%`);
                        }

                        break;
                }
            }
        }

        let sortBuilder = whereBuilder;

        if (sorting?.length) {
            for (const sort of sorting) {
                sortBuilder = sortBuilder.orderBy(sql.ref(sort.id), (ob) => {
                    const orderBy = sort.desc ? ob.desc() : ob.asc();
                    return orderBy.nullsLast();
                });
            }
        } else {
            sortBuilder = sortBuilder.orderBy('requestAt', 'desc');
        }

        const query = sortBuilder.selectAll().offset(start).limit(size);

        const { count } = await this.qb.kysely
            .selectFrom('userSubscriptionRequestHistory')
            .select((eb) => eb.fn.countAll().as('count'))
            .$if(!isFiltersEmpty, (qb) => {
                let countBuilder = qb;
                for (const filter of filters!) {
                    const mode = filterModes?.[filter.id] || 'contains';

                    if (['requestAt'].includes(filter.id)) {
                        countBuilder = countBuilder.where(
                            filter.id as keyof DB['userSubscriptionRequestHistory'],
                            '=',
                            new Date(filter.value as string),
                        );
                        continue;
                    }

                    if (filter.id === 'id') {
                        try {
                            const searchValue = filter.value as string;
                            BigInt(searchValue);

                            countBuilder = countBuilder.where(
                                sql`CAST(id AS TEXT)`,
                                'like',
                                `%${searchValue}%`,
                            );
                        } catch {
                            countBuilder = countBuilder.where('id', 'is', null);
                        }
                        continue;
                    }

                    const field = filter.id as keyof DB['userSubscriptionRequestHistory'];

                    switch (mode) {
                        default:
                            if (field === 'userUuid') {
                                countBuilder = countBuilder.where(
                                    sql`"user_uuid"::text`,
                                    'ilike',
                                    `%${filter.value}%`,
                                );
                            } else {
                                countBuilder = countBuilder.where(
                                    field,
                                    'ilike',
                                    `%${filter.value}%`,
                                );
                            }
                            break;
                    }
                }
                return countBuilder;
            })
            .executeTakeFirstOrThrow();

        const users = await query.execute();

        const result = users.map((u) => new UserSubscriptionRequestHistoryEntity(u));
        return [result, Number(count)];
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
