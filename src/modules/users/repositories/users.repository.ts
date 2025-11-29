import { SelectExpression, sql, ExpressionBuilder } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import dayjs from 'dayjs';

import { TResetPeriods, TUsersStatus, USERS_STATUS } from '@contract/constants';
import { DB } from 'prisma/generated/types';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

import { TxKyselyService } from '@common/database/tx-kysely.service';
import { getKyselyUuid } from '@common/helpers/kysely';
import { GetAllUsersCommand } from '@libs/contracts/commands';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

import {
    BatchResetLimitedUsersUsageBuilder,
    BulkDeleteByStatusBuilder,
    BulkUpdateUserUsedTrafficBuilder,
} from '../builders';
import {
    IGetUserAccessibleNodes,
    IGetUserAccessibleNodesResponse,
    IUserOnlineStats,
    IUserStats,
} from '../interfaces';
import {
    BaseUserEntity,
    UserForConfigEntity,
    UserEntity,
    UserWithResolvedInboundEntity,
} from '../entities';
import { TriggerThresholdNotificationsBuilder } from '../builders/trigger-threshold-notifications-builder';
import { UserTrafficEntity } from '../entities/user-traffic.entity';
import { UserConverter } from '../users.converter';

@Injectable()
export class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);

    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly userConverter: UserConverter,
    ) {}

    public async create(entity: BaseUserEntity): Promise<{
        uuid: string;
    }> {
        const model = this.userConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.users.create({
            select: {
                uuid: true,
                tId: true,
            },
            data: {
                ...model,
            },
        });

        await this.prisma.tx.userTraffic.create({
            select: {
                tId: true,
            },
            data: {
                tId: result.tId,
            },
        });

        return {
            uuid: result.uuid,
        };
    }

    public async bulkIncrementUsedTraffic(
        userUsageList: { u: string; b: string; n: string }[],
    ): Promise<{ tId: bigint }[]> {
        const { query } = new BulkUpdateUserUsedTrafficBuilder(userUsageList);
        const result = await this.prisma.tx.$queryRaw<{ tId: bigint }[]>(query);

        return result;
    }

    public async triggerThresholdNotifications(percentages: number[]): Promise<{ tId: bigint }[]> {
        const { query } = new TriggerThresholdNotificationsBuilder(percentages);
        return await this.prisma.tx.$queryRaw<{ tId: bigint }[]>(query);
    }

    public async updateStatusAndTrafficAndResetAt(
        userUuid: string,
        lastResetAt: Date,
        status?: TUsersStatus,
    ): Promise<void> {
        await this.prisma.tx.users.update({
            where: { uuid: userUuid },
            data: {
                status,
                lastTrafficResetAt: lastResetAt,
                lastTriggeredThreshold: 0,
                traffic: {
                    update: {
                        usedTrafficBytes: 0,
                    },
                },
            },
        });
    }

    public async updateSubLastOpenedAndUserAgent(
        userUuid: string,
        subLastOpenedAt: Date,
        subLastUserAgent: string,
    ): Promise<void> {
        await this.qb.kysely
            .updateTable('users')
            .set({ subLastOpenedAt, subLastUserAgent })
            .where('uuid', '=', getKyselyUuid(userUuid))
            .clearReturning()
            .execute();
    }

    public async updateExceededTrafficUsers(): Promise<{ tId: bigint }[]> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({ status: USERS_STATUS.LIMITED })
            .from('userTraffic')
            .whereRef('userTraffic.tId', '=', 'users.tId')
            .where('users.status', '=', USERS_STATUS.ACTIVE)
            .where('users.trafficLimitBytes', '!=', 0n)
            .whereRef('userTraffic.usedTrafficBytes', '>=', 'users.trafficLimitBytes')
            .returning(['users.tId'])
            .execute();

        return result;
    }

    public async findUsersByExpireAt(start: Date, end: Date): Promise<{ tId: bigint }[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select('tId')
            .where('expireAt', '>=', start)
            .where('expireAt', '<=', end)
            .execute();
        return result.map((value) => ({ tId: value.tId }));
    }

    public async updateExpiredUsers(): Promise<{ tId: bigint }[]> {
        // UPDATE "public"."users" SET "status" = $1, "updated_at" = $2 WHERE ("public"."users"."status" IN ($3,$4) AND "public"."users"."expire_at" < $5) RETURNING "public"."users"."uuid"
        const result = await this.prisma.tx.users.updateManyAndReturn({
            select: {
                tId: true,
            },
            where: {
                AND: [
                    {
                        status: {
                            in: [USERS_STATUS.ACTIVE, USERS_STATUS.LIMITED],
                        },
                    },
                    {
                        expireAt: {
                            lt: new Date(),
                        },
                    },
                ],
            },
            data: {
                status: USERS_STATUS.EXPIRED,
            },
        });

        return result;
    }

    public async getAllUsersV2({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetAllUsersCommand.RequestQuery): Promise<[UserEntity[], number]> {
        const qb = this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId');

        let isFiltersEmpty = true;

        let whereBuilder = qb;

        if (filters?.length) {
            isFiltersEmpty = false;
            for (const filter of filters) {
                const mode = filterModes?.[filter.id] || 'contains';

                if (
                    [
                        'createdAt',
                        'expireAt',
                        'lastTrafficResetAt',
                        'subLastOpenedAt',
                        'userTraffic.onlineAt',
                    ].includes(filter.id)
                ) {
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
                            sql`CAST(users.t_id AS TEXT)`,
                            'like',
                            `%${searchValue}%`,
                        );
                    } catch {
                        continue;
                    }
                    continue;
                }

                if (filter.id === 'telegramId') {
                    try {
                        const searchValue = filter.value as string;
                        BigInt(searchValue);

                        whereBuilder = whereBuilder.where(
                            sql`CAST(telegram_id AS TEXT)`,
                            'like',
                            `%${searchValue}%`,
                        );
                    } catch {
                        whereBuilder = whereBuilder.where('telegramId', 'is', null);
                    }
                    continue;
                }

                if (filter.id === 'activeInternalSquads') {
                    whereBuilder = whereBuilder.where('uuid', 'in', (eb) =>
                        eb
                            .selectFrom('internalSquadMembers')
                            .select('internalSquadMembers.userUuid')
                            .where(
                                'internalSquadMembers.internalSquadUuid',
                                '=',
                                getKyselyUuid(filter.value as string),
                            ),
                    );
                    continue;
                }

                if (filter.id === 'nodeName') {
                    whereBuilder = whereBuilder.where(
                        'userTraffic.lastConnectedNodeUuid',
                        '=',
                        getKyselyUuid(filter.value as string),
                    );
                    continue;
                }

                if (filter.id === 'uuid') {
                    whereBuilder = whereBuilder.where(
                        sql`"uuid"::text`,
                        'ilike',
                        `%${filter.value}%`,
                    );
                    continue;
                }

                if (filter.id === 'externalSquadUuid') {
                    whereBuilder = whereBuilder.where(
                        'externalSquadUuid',
                        '=',
                        getKyselyUuid(filter.value as string),
                    );
                    continue;
                }

                const field = filter.id as keyof DB['users'];

                switch (mode) {
                    case 'startsWith':
                        whereBuilder = whereBuilder.where(field, 'like', `${filter.value}%`);
                        break;
                    case 'endsWith':
                        whereBuilder = whereBuilder.where(field, 'like', `%${filter.value}`);
                        break;
                    case 'equals':
                        whereBuilder = whereBuilder.where(field, '=', filter.value as string);
                        break;
                    default: // 'contains'
                        whereBuilder = whereBuilder.where(field, 'ilike', `%${filter.value}%`);
                        break;
                }
            }
        }

        let sortBuilder = whereBuilder;

        if (sorting?.length) {
            for (const sort of sorting) {
                let sorId = sort.id;
                if (sort.id === 'id') {
                    sorId = 'users.tId';
                }
                sortBuilder = sortBuilder.orderBy(sql.ref(sorId), (ob) => {
                    const orderBy = sort.desc ? ob.desc() : ob.asc();
                    return orderBy.nullsLast();
                });
            }
        } else {
            sortBuilder = sortBuilder.orderBy('users.tId', 'desc');
        }

        const query = sortBuilder
            .selectAll()
            .offset(start)
            .limit(size)
            .select((eb) => this.includeActiveInternalSquads(eb));

        const { count } = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
            .select((eb) => eb.fn.countAll().as('count'))
            .$if(!isFiltersEmpty, (qb) => {
                let countBuilder = qb;
                for (const filter of filters!) {
                    const mode = filterModes?.[filter.id] || 'contains';

                    if (
                        [
                            'createdAt',
                            'expireAt',
                            'lastTrafficResetAt',
                            'subLastOpenedAt',
                            'userTraffic.onlineAt',
                        ].includes(filter.id)
                    ) {
                        countBuilder = countBuilder.where(
                            filter.id as keyof DB['users'],
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
                                sql`CAST(users.t_id AS TEXT)`,
                                'like',
                                `%${searchValue}%`,
                            );
                        } catch {
                            continue;
                        }
                        continue;
                    }

                    if (filter.id === 'telegramId') {
                        try {
                            const searchValue = filter.value as string;
                            BigInt(searchValue);

                            countBuilder = countBuilder.where(
                                sql`CAST(telegram_id AS TEXT)`,
                                'like',
                                `%${searchValue}%`,
                            );
                        } catch {
                            countBuilder = countBuilder.where('telegramId', 'is', null);
                        }
                        continue;
                    }

                    if (filter.id === 'activeInternalSquads') {
                        countBuilder = countBuilder.where('uuid', 'in', (eb) =>
                            eb
                                .selectFrom('internalSquadMembers')
                                .select('internalSquadMembers.userUuid')
                                .where(
                                    'internalSquadMembers.internalSquadUuid',
                                    '=',
                                    getKyselyUuid(filter.value as string),
                                ),
                        );
                        continue;
                    }

                    if (filter.id === 'nodeName') {
                        countBuilder = countBuilder.where(
                            'userTraffic.lastConnectedNodeUuid',
                            '=',
                            getKyselyUuid(filter.value as string),
                        );
                        continue;
                    }

                    if (filter.id === 'uuid') {
                        countBuilder = countBuilder.where(
                            sql`"uuid"::text`,
                            'ilike',
                            `%${filter.value}%`,
                        );
                        continue;
                    }

                    if (filter.id === 'externalSquadUuid') {
                        countBuilder = countBuilder.where(
                            'externalSquadUuid',
                            '=',
                            getKyselyUuid(filter.value as string),
                        );
                        continue;
                    }

                    const field = filter.id as keyof DB['users'];

                    switch (mode) {
                        case 'startsWith':
                            countBuilder = countBuilder.where(field, 'like', `${filter.value}%`);
                            break;
                        case 'endsWith':
                            countBuilder = countBuilder.where(field, 'like', `%${filter.value}`);
                            break;
                        case 'equals':
                            countBuilder = countBuilder.where(field, '=', filter.value as string);
                            break;
                        default:
                            countBuilder = countBuilder.where(field, 'ilike', `%${filter.value}%`);
                            break;
                    }
                }
                return countBuilder;
            })
            .executeTakeFirstOrThrow();

        const users = await query.execute();

        const result = users.map((u) => new UserEntity(u));
        return [result, Number(count)];
    }

    public async getUsersWithPagination({
        start,
        size,
    }: GetAllUsersCommand.RequestQuery): Promise<[UserEntity[], number]> {
        const [users, total] = await Promise.all([
            this.qb.kysely
                .selectFrom('users')
                .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
                .selectAll()
                .select((eb) => this.includeActiveInternalSquads(eb))
                .offset(start)
                .limit(size)
                .orderBy('users.tId', 'desc')
                .execute(),
            this.qb.kysely
                .selectFrom('users')
                .select((eb) => eb.fn.countAll().as('count'))
                .executeTakeFirstOrThrow(),
        ]);

        const usersResult = users.map((user) => new UserEntity(user));

        return [usersResult, Number(total.count)];
    }

    public async update({ uuid, ...data }: Partial<BaseUserEntity>): Promise<BaseUserEntity> {
        const result = await this.prisma.tx.users.update({
            where: {
                uuid,
            },
            data,
        });

        return this.userConverter.fromPrismaModelToEntity(result);
    }

    public async updateUserStatus(uuid: string, status: TUsersStatus): Promise<boolean> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({ status })
            .where('uuid', '=', getKyselyUuid(uuid))
            .clearReturning()
            .executeTakeFirstOrThrow();

        return !!result;
    }

    public async findUniqueByCriteria(
        dto: Partial<Pick<BaseUserEntity, 'uuid' | 'shortUuid' | 'username' | 'tId'>>,
        includeOptions: {
            activeInternalSquads: boolean;
        } = {
            activeInternalSquads: true,
        },
    ): Promise<UserEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
            .selectAll()
            .$if(includeOptions.activeInternalSquads, (qb) =>
                qb.select((eb) => this.includeActiveInternalSquads(eb)),
            )
            .where((eb) => {
                const conditions = [];

                if (dto.uuid) conditions.push(eb('uuid', '=', getKyselyUuid(dto.uuid)));
                if (dto.shortUuid) conditions.push(eb('shortUuid', '=', dto.shortUuid));
                if (dto.username) conditions.push(eb('username', '=', dto.username));
                if (dto.tId) conditions.push(eb('users.tId', '=', dto.tId));

                return eb.or(conditions);
            })
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new UserEntity(result);
    }

    public async findByNonUniqueCriteria(
        dto: Partial<Pick<BaseUserEntity, 'telegramId' | 'email' | 'tag'>>,
        includeOptions: {
            activeInternalSquads: boolean;
        } = {
            activeInternalSquads: true,
        },
    ): Promise<UserEntity[]> {
        const user = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
            .selectAll()
            .$if(includeOptions.activeInternalSquads, (qb) =>
                qb.select((eb) => this.includeActiveInternalSquads(eb)),
            )
            .where((eb) => {
                const conditions = [];

                if (dto.telegramId) conditions.push(eb('telegramId', '=', dto.telegramId));
                if (dto.email) conditions.push(eb('email', '=', dto.email));
                if (dto.tag) conditions.push(eb('tag', '=', dto.tag));

                return eb.or(conditions);
            })
            .execute();

        return user.map((user) => new UserEntity(user));
    }

    public async findFirstByCriteria(dto: Partial<BaseUserEntity>): Promise<null | BaseUserEntity> {
        const result = await this.prisma.tx.users.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.userConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.users.delete({ where: { uuid } });
        return !!result;
    }

    public async getUserStats(): Promise<IUserStats> {
        const statusCounts = await this.prisma.tx.users.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
            where: {
                status: {
                    in: Object.values(USERS_STATUS),
                },
            },
        });

        const formattedStatusCounts = Object.values(USERS_STATUS).reduce(
            (acc, status) => ({
                ...acc,
                [status]: statusCounts.find((item) => item.status === status)?._count.status || 0,
            }),
            {} as Record<TUsersStatus, number>,
        );

        const totalUsers = Object.values(formattedStatusCounts).reduce(
            (acc, count) => acc + count,
            0,
        );

        return {
            statusCounts: formattedStatusCounts,
            totalUsers,
        };
    }

    public async getUserOnlineStats(): Promise<IUserOnlineStats> {
        const now = dayjs().utc();

        const result = await this.qb.kysely
            .selectFrom('userTraffic')
            .select((eb) => [
                eb.fn
                    .count('userTraffic.tId')
                    .filterWhere('userTraffic.onlineAt', '>=', now.subtract(1, 'minute').toDate())
                    .as('onlineNow'),
                eb.fn
                    .count('userTraffic.tId')
                    .filterWhere('userTraffic.onlineAt', '>=', now.subtract(1, 'day').toDate())
                    .as('lastDay'),
                eb.fn
                    .count('userTraffic.tId')
                    .filterWhere('userTraffic.onlineAt', '>=', now.subtract(1, 'week').toDate())
                    .as('lastWeek'),
                eb.fn
                    .count('userTraffic.tId')
                    .filterWhere('userTraffic.onlineAt', 'is', null)
                    .as('neverOnline'),
            ])
            .executeTakeFirstOrThrow();

        return {
            onlineNow: Number(result.onlineNow),
            lastDay: Number(result.lastDay),
            lastWeek: Number(result.lastWeek),
            neverOnline: Number(result.neverOnline),
        };
    }

    public async resetUserTraffic(strategy: TResetPeriods): Promise<void> {
        await this.qb.kysely
            .with('usersToReset', (db) =>
                db
                    .selectFrom('users')
                    .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
                    .select([
                        'users.uuid as uuid',
                        'users.tId as tId',
                        'userTraffic.usedTrafficBytes as usedTrafficBytes',
                    ])
                    .where('trafficLimitStrategy', '=', strategy)
                    .where('status', '!=', USERS_STATUS.LIMITED),
            )
            .with('insertHistory', (db) =>
                db
                    .insertInto('userTrafficHistory')
                    .columns(['userUuid', 'usedBytes'])
                    .expression(db.selectFrom('usersToReset').select(['uuid', 'usedTrafficBytes'])),
            )
            .with('updateUsers', (db) =>
                db
                    .updateTable('users')
                    .set({
                        lastTrafficResetAt: new Date(),
                        lastTriggeredThreshold: 0,
                    })
                    .where('uuid', 'in', (eb) => eb.selectFrom('usersToReset').select('uuid'))
                    .returning('tId'),
            )
            .updateTable('userTraffic')
            .set({
                usedTrafficBytes: 0n,
            })
            .where('tId', 'in', (eb) => eb.selectFrom('usersToReset').select('tId'))
            .execute();
    }

    // public async resetUserTraffic(strategy: TResetPeriods): Promise<void> {
    //     const whereExpression = (eb: ExpressionBuilder<DB, 'users'>) => {
    //         return eb.and([
    //             eb('trafficLimitStrategy', '=', strategy),
    //             eb('status', '!=', USERS_STATUS.LIMITED),
    //         ]);
    //     };

    //     await this.qb.kysely
    //         .insertInto('userTrafficHistory')
    //         .columns(['userUuid', 'usedBytes'])
    //         .expression((db) =>
    //             db
    //                 .selectFrom('users')
    //                 .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
    //                 .select(['users.uuid as userUuid', 'userTraffic.usedTrafficBytes as usedBytes'])
    //                 .where(whereExpression),
    //         )
    //         .execute();

    //     await this.qb.kysely
    //         .updateTable('userTraffic')
    //         .set({ usedTrafficBytes: 0n })
    //         .from('users')
    //         .whereRef('userTraffic.tId', '=', 'users.tId')
    //         .where(whereExpression)
    //         .execute();

    //     await this.qb.kysely
    //         .updateTable('users')
    //         .set({
    //             lastTrafficResetAt: new Date(),
    //             lastTriggeredThreshold: 0,
    //         })
    //         .where(whereExpression)
    //         .execute();
    // }

    public async resetLimitedUsersTraffic(strategy: TResetPeriods): Promise<{ tId: bigint }[]> {
        const { query } = new BatchResetLimitedUsersUsageBuilder(strategy);
        const result = await this.prisma.tx.$queryRaw<{ tId: bigint }[]>(query);

        return result;
    }

    public async deleteManyByStatus(status: TUsersStatus, limit?: number): Promise<number> {
        const { query } = new BulkDeleteByStatusBuilder(status, limit);

        const result = await this.prisma.tx.$executeRaw<unknown>(query);

        return result || 0;
    }

    public async *getUsersForConfigStream(
        activeInbounds: ConfigProfileInboundEntity[],
    ): AsyncGenerator<UserForConfigEntity[]> {
        const BATCH_SIZE = 100_000;
        let lastTId: bigint | null = null;
        let hasMoreData = true;

        while (hasMoreData) {
            const builder = this.qb.kysely
                .selectFrom('users')
                .where('users.status', '=', USERS_STATUS.ACTIVE)
                .innerJoin('internalSquadMembers', 'internalSquadMembers.userUuid', 'users.uuid')
                .innerJoin(
                    'internalSquadInbounds',
                    'internalSquadInbounds.internalSquadUuid',
                    'internalSquadMembers.internalSquadUuid',
                )
                .innerJoin(
                    'configProfileInbounds',
                    'configProfileInbounds.uuid',
                    'internalSquadInbounds.inboundUuid',
                )
                .$if(lastTId !== null, (qb) => qb.where('users.tId', '>', lastTId!))
                .where(
                    'internalSquadInbounds.inboundUuid',
                    'in',
                    activeInbounds.map((inbound) => getKyselyUuid(inbound.uuid)),
                )
                .select((eb) => [
                    'users.tId',
                    'users.trojanPassword',
                    'users.vlessUuid',
                    'users.ssPassword',
                    sql<
                        string[]
                    >`coalesce(json_agg(DISTINCT ${eb.ref('configProfileInbounds.tag')}), '[]')`.as(
                        'tags',
                    ),
                ])
                .groupBy([
                    'users.tId',
                    'users.trojanPassword',
                    'users.vlessUuid',
                    'users.ssPassword',
                ])
                .orderBy(sql<string>`users.t_id asc`)
                .limit(BATCH_SIZE);

            const start = performance.now();
            const result = await builder.execute();
            this.logger.log(
                `[getUsersForConfigStream] ${performance.now() - start}ms, length: ${result.length}`,
            );

            if (result.length < BATCH_SIZE) {
                hasMoreData = false;
            }

            if (result.length > 0) {
                lastTId = result[result.length - 1].tId;
                yield result;
            } else {
                break;
            }
        }
    }

    public async deleteManyByUuid(uuids: string[]): Promise<number> {
        const result = await this.prisma.tx.users.deleteMany({ where: { uuid: { in: uuids } } });

        return result.count;
    }

    public async getMinMaxBatchRange(batchSize = 10_000): Promise<{
        ranges: { min: bigint; max: bigint }[];
    }> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select((eb) => [eb.fn.min('users.tId').as('min'), eb.fn.max('users.tId').as('max')])
            .executeTakeFirstOrThrow();

        if (result.min === null || result.max === null) {
            return { ranges: [] };
        }

        const minTId = BigInt(result.min);
        const maxTId = BigInt(result.max);
        const step = BigInt(batchSize);

        const ranges: { min: bigint; max: bigint }[] = [];

        for (let i = minTId; i <= maxTId; i += step) {
            ranges.push({ min: i, max: i + step - 1n });
        }

        return { ranges };
    }

    public async bulkAllExtendExpirationDate(extendDays: number): Promise<number> {
        const { ranges } = await this.getMinMaxBatchRange();
        let totalUpdated = 0;
        for (const batch of ranges) {
            const result = await this.qb.kysely
                .updateTable('users')
                .set({
                    expireAt: sql`expire_at + (${extendDays}::int || ' days')::interval`,
                })
                .where('tId', '>=', batch.min)
                .where('tId', '<=', batch.max)
                .executeTakeFirst();
            if (result) {
                totalUpdated += Number(result.numUpdatedRows ?? 0n);
            }
        }
        return totalUpdated;
    }

    public async bulkExtendExpirationDateByUuids(
        uuids: string[],
        extendDays: number,
    ): Promise<number> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({
                expireAt: sql`expire_at + (${extendDays}::int || ' days')::interval`,
            })
            .where(
                'uuid',
                'in',
                uuids.map((uuid) => getKyselyUuid(uuid)),
            )
            .executeTakeFirst();

        return Number(result?.numUpdatedRows ?? 0n);
    }

    public async bulkSyncExpiredUsersByUuids(uuids: string[]): Promise<string[]> {
        const result = await this.prisma.tx.users.updateManyAndReturn({
            select: {
                uuid: true,
            },
            where: {
                uuid: {
                    in: uuids,
                },
                status: 'EXPIRED',
                OR: [
                    {
                        expireAt: {
                            gt: new Date(),
                        },
                    },
                ],
            },
            data: {
                status: 'ACTIVE',
            },
        });

        return result.map((user) => user.uuid);
    }

    public async bulkUpdateAllUsersByRange({
        ranges,
        fields,
    }: {
        ranges: { min: bigint; max: bigint }[];
        fields: Partial<BaseUserEntity>;
    }): Promise<number> {
        let totalUpdated = 0;
        for (const range of ranges) {
            const result = await this.prisma.tx.users.updateMany({
                where: { tId: { gte: range.min, lte: range.max } },
                data: { ...fields, lastTriggeredThreshold: 0 },
            });
            totalUpdated += result.count ?? 0;
        }

        return totalUpdated;
    }

    public async bulkUpdateAllUsers(fields: Partial<BaseUserEntity>): Promise<number> {
        const result = await this.prisma.tx.users.updateMany({
            data: fields,
        });
        return result.count;
    }

    public async bulkSyncLimitedUsers(): Promise<number> {
        const res = await this.qb.kysely
            .updateTable('users')
            .set({ status: USERS_STATUS.ACTIVE })
            .from('userTraffic')
            .whereRef('userTraffic.tId', '=', 'users.tId')
            .where('users.status', '=', USERS_STATUS.LIMITED)
            .where((eb) =>
                eb.or([
                    // trafficLimitBytes = 0
                    eb('users.trafficLimitBytes', '=', 0n),

                    // trafficLimitBytes > 0 AND usedTrafficBytes < trafficLimitBytes
                    eb.and([
                        eb('users.trafficLimitBytes', '>', 0n),
                        eb('userTraffic.usedTrafficBytes', '<', eb.ref('users.trafficLimitBytes')),
                    ]),

                    eb('userTraffic.usedTrafficBytes', '=', 0n),
                ]),
            )
            .executeTakeFirst();

        return Number(res?.numUpdatedRows ?? 0n);
    }

    public async bulkSyncExpiredUsers(): Promise<number> {
        const result = await this.prisma.tx.users.updateMany({
            where: {
                status: 'EXPIRED',
                OR: [
                    {
                        expireAt: {
                            gt: new Date(),
                        },
                    },
                ],
            },
            data: {
                status: 'ACTIVE',
            },
        });

        return result.count;
    }

    public async bulkUpdateUsers(
        uuids: string[],
        fields: Partial<BaseUserEntity>,
    ): Promise<number> {
        const result = await this.prisma.tx.users.updateMany({
            where: { uuid: { in: uuids } },
            data: fields,
        });

        return result.count;
    }

    public async getAllTags(): Promise<string[]> {
        const result = await this.qb.kysely.selectFrom('users').select('tag').distinct().execute();

        return result.map((user) => user.tag).filter((tag) => tag !== null);
    }

    public async countByStatus(status: TUsersStatus): Promise<number> {
        const result = await this.prisma.tx.users.count({ where: { status } });

        return result;
    }

    public async removeUsersFromInternalSquads(usersUuids: string[]): Promise<void> {
        await this.qb.kysely
            .deleteFrom('internalSquadMembers')
            .where(
                'userUuid',
                'in',
                usersUuids.map((uuid) => getKyselyUuid(uuid)),
            )
            .execute();
    }

    public async addUsersToInternalSquads(
        usersUuids: string[],
        internalSquadsUuids: string[],
    ): Promise<void> {
        await this.qb.kysely
            .insertInto('internalSquadMembers')
            .columns(['userUuid', 'internalSquadUuid'])
            .values(
                usersUuids.flatMap((userUuid) =>
                    internalSquadsUuids.map((internalSquadUuid) => ({
                        userUuid: getKyselyUuid(userUuid),
                        internalSquadUuid: getKyselyUuid(internalSquadUuid),
                    })),
                ),
            )
            .execute();
    }

    public async addUserToInternalSquads(
        userUuid: string,
        internalSquadUuid: string[],
    ): Promise<boolean> {
        if (internalSquadUuid.length === 0) {
            return true;
        }

        const result = await this.qb.kysely
            .insertInto('internalSquadMembers')
            .columns(['userUuid', 'internalSquadUuid'])
            .values(
                internalSquadUuid.map((internalSquadUuid) => ({
                    userUuid: getKyselyUuid(userUuid),
                    internalSquadUuid: getKyselyUuid(internalSquadUuid),
                })),
            )
            .onConflict((oc) => oc.doNothing())
            .clearReturning()
            .executeTakeFirst();

        return !!result;
    }

    public async removeUserFromInternalSquads(userUuid: string): Promise<void> {
        await this.qb.kysely
            .deleteFrom('internalSquadMembers')
            .where('userUuid', '=', getKyselyUuid(userUuid))
            .clearReturning()
            .executeTakeFirst();
    }

    public async getPartialUserByUniqueFields<T extends SelectExpression<DB, 'users'>>(
        dto: Partial<Pick<BaseUserEntity, 'uuid' | 'shortUuid' | 'username' | 'tId'>>,
        select: T[],
    ) {
        const user = await this.qb.kysely
            .selectFrom('users')
            .select(select)
            .where((eb) => {
                const conditions = [];

                if (dto.uuid) conditions.push(eb('uuid', '=', getKyselyUuid(dto.uuid)));
                if (dto.shortUuid) conditions.push(eb('shortUuid', '=', dto.shortUuid));
                if (dto.username) conditions.push(eb('username', '=', dto.username));
                if (dto.tId) conditions.push(eb('tId', '=', dto.tId));

                return eb.or(conditions);
            })
            .executeTakeFirst();

        return user;
    }

    public async getUserTrafficByTId(tId: bigint): Promise<UserTrafficEntity> {
        const result = await this.qb.kysely
            .selectFrom('userTraffic')
            .selectAll()
            .where('tId', '=', tId)
            .executeTakeFirstOrThrow();

        return new UserTrafficEntity(result);
    }

    public async revokeUserSubscription(
        dto: Pick<
            BaseUserEntity,
            'uuid' | 'trojanPassword' | 'vlessUuid' | 'ssPassword' | 'subRevokedAt' | 'shortUuid'
        >,
    ): Promise<boolean> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({
                subRevokedAt: dto.subRevokedAt,
                trojanPassword: dto.trojanPassword,
                vlessUuid: getKyselyUuid(dto.vlessUuid),
                ssPassword: dto.ssPassword,
                shortUuid: dto.shortUuid,
            })
            .where('uuid', '=', getKyselyUuid(dto.uuid))
            .executeTakeFirst();

        return !!result;
    }

    public async getUserWithResolvedInbounds(
        userUuid: string,
    ): Promise<UserWithResolvedInboundEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select((eb) => [
                'users.uuid as userUuid',
                'users.tId',
                'users.trojanPassword',
                'users.vlessUuid',
                'users.ssPassword',
                jsonArrayFrom(
                    eb
                        .selectFrom('internalSquadMembers')
                        .innerJoin(
                            'internalSquads',
                            'internalSquadMembers.internalSquadUuid',
                            'internalSquads.uuid',
                        )
                        .innerJoin(
                            'internalSquadInbounds',
                            'internalSquads.uuid',
                            'internalSquadInbounds.internalSquadUuid',
                        )
                        .innerJoin(
                            'configProfileInbounds',
                            'internalSquadInbounds.inboundUuid',
                            'configProfileInbounds.uuid',
                        )
                        .select([
                            'configProfileInbounds.profileUuid',
                            'configProfileInbounds.uuid',
                            'configProfileInbounds.tag',
                            'configProfileInbounds.type',
                            'configProfileInbounds.network',
                            'configProfileInbounds.security',
                            'configProfileInbounds.port',
                            'configProfileInbounds.rawInbound',
                        ])
                        .whereRef('internalSquadMembers.userUuid', '=', 'users.uuid'),
                )
                    .$notNull()
                    .as('inbounds'),
            ])
            .where('users.uuid', '=', getKyselyUuid(userUuid))
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new UserWithResolvedInboundEntity(result);
    }

    public async getUserAccessibleNodes(
        userUuid: string,
    ): Promise<IGetUserAccessibleNodesResponse> {
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
            .innerJoin('internalSquads as sq', 'sq.uuid', 'isi.internalSquadUuid')
            .innerJoin('internalSquadMembers as ism', (join) =>
                join
                    .onRef('ism.internalSquadUuid', '=', 'sq.uuid')
                    .on('ism.userUuid', '=', getKyselyUuid(userUuid)),
            )
            .select([
                'n.uuid as nodeUuid',
                'n.name as nodeName',
                'n.countryCode',
                'cp.uuid as configProfileUuid',
                'cp.name as configProfileName',
                'sq.uuid as squadUuid',
                'sq.name as squadName',
                'cpi.tag as inboundTag',
            ])
            .execute();

        const nodesMap = new Map<string, IGetUserAccessibleNodes>();

        flatResults.forEach((row) => {
            if (!nodesMap.has(row.nodeUuid)) {
                nodesMap.set(row.nodeUuid, {
                    uuid: row.nodeUuid,
                    nodeName: row.nodeName,
                    countryCode: row.countryCode,
                    configProfileUuid: row.configProfileUuid,
                    configProfileName: row.configProfileName,
                    activeSquads: new Map(),
                });
            }

            const node = nodesMap.get(row.nodeUuid);

            if (node) {
                if (!node.activeSquads.has(row.squadUuid)) {
                    node.activeSquads.set(row.squadUuid, {
                        squadName: row.squadName,
                        activeInbounds: [],
                    });
                }

                const squad = node.activeSquads.get(row.squadUuid);

                if (squad) {
                    squad.activeInbounds.push(row.inboundTag);
                }
            }
        });

        const result: IGetUserAccessibleNodesResponse = {
            userUuid,
            activeNodes: Array.from(nodesMap.values()).map((node) => ({
                ...node,
                activeSquads: Array.from(node.activeSquads.values()),
            })),
        };

        return result;
    }

    private includeActiveInternalSquads(eb: ExpressionBuilder<DB, 'users'>) {
        return jsonArrayFrom(
            eb
                .selectFrom('internalSquadMembers')
                .innerJoin(
                    'internalSquads',
                    'internalSquads.uuid',
                    'internalSquadMembers.internalSquadUuid',
                )
                .select(['internalSquads.uuid', 'internalSquads.name'])
                .whereRef('internalSquadMembers.userUuid', '=', 'users.uuid'),
        ).as('activeInternalSquads');
    }

    public async getUserUuidByUsername(
        username: string,
    ): Promise<{ uuid: string; tId: bigint } | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select(['uuid'])
            .select(sql.ref<bigint>('t_id').as('tId'))
            .where('username', '=', username)
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return { uuid: result.uuid, tId: result.tId };
    }

    public async findNotConnectedUsers(startDate: Date, endDate: Date): Promise<UserEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.tId', 'users.tId')
            .selectAll()
            .where('status', '=', 'ACTIVE')
            .where('userTraffic.firstConnectedAt', 'is', null)
            .where('userTraffic.onlineAt', 'is', null)
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<', endDate)
            .execute();

        return result.map((value) => new UserEntity(value));
    }

    public async getShortUuidRange(): Promise<{
        min: number;
        max: number;
    }> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select(sql.raw<number>('COALESCE(MIN(LENGTH(short_uuid)), 0)').as('minLength'))
            .select(sql.raw<number>('COALESCE(MAX(LENGTH(short_uuid)), 0)').as('maxLength'))
            .executeTakeFirst();

        if (result === undefined) {
            return {
                min: 0,
                max: 0,
            };
        }

        return {
            min: Number(result.minLength),
            max: Number(result.maxLength),
        };
    }
}
