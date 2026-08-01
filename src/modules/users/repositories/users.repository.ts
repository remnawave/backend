import type {
    IGetUserAccessibleNodes,
    IGetUserAccessibleNodesResponse,
    IUpdateUserDto,
    IUserOnlineStats,
    IUserStats,
} from '../interfaces';

import { TResetPeriods, TUsersStatus, USERS_STATUS } from '@contract/constants';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import dayjs from 'dayjs';
import { SelectExpression, sql, ExpressionBuilder } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { DB } from 'prisma/generated/types';

import { Injectable, Logger } from '@nestjs/common';

import { TxKyselyService } from '@common/database/tx-kysely.service';
import { getKyselyUuid, paginateQuery } from '@common/helpers/kysely';
import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

import { BulkDeleteByStatusBuilder, BulkUpdateUserUsedTrafficBuilder } from '../builders';
import { TriggerThresholdNotificationsBuilder } from '../builders/trigger-threshold-notifications-builder';
import { GetUsersQueryDto, GetUsersStreamQueryDto } from '../dtos';
import {
    BaseUserEntity,
    UserForConfigEntity,
    UserEntity,
    UserWithResolvedInboundEntity,
} from '../entities';
import { UserTrafficEntity } from '../entities/user-traffic.entity';
import { UserConverter } from '../users.converter';

const USERS_FILTER_COLUMN_MAP = {
    id: sql.ref('users.id'),
    createdAt: sql.ref('users.created_at'),
    expireAt: sql.ref('users.expire_at'),
    lastTrafficResetAt: sql.ref('users.last_traffic_reset_at'),
    subRevokedAt: sql.ref('users.sub_revoked_at'),
    telegramId: sql.ref('users.telegram_id'),
    vlessUuid: sql.ref('users.vless_uuid'),
    trojanPassword: sql.ref('users.trojan_password'),
    externalSquadUuid: sql.ref('users.external_squad_uuid'),
    username: sql.ref('users.username'),
    status: sql.ref('users.status'),
    shortUuid: sql.ref('users.short_uuid'),
    description: sql.ref('users.description'),
    email: sql.ref('users.email'),
    tag: sql.ref('users.tag'),
    'userTraffic.onlineAt': sql.ref('user_traffic.online_at'),
    'userTraffic.firstConnectedAt': sql.ref('user_traffic.first_connected_at'),
    'userTraffic.lifetimeUsedTrafficBytes': sql.ref('user_traffic.lifetime_used_traffic_bytes'),
    usedTrafficBytes: sql.ref('user_traffic.used_traffic_bytes'),
    hwidDeviceLimit: sql.ref('users.hwid_device_limit'),
    trafficLimitBytes: sql.ref('users.traffic_limit_bytes'),

    activeInternalSquads: null,
    nodeName: null,
} as const;

const NUMERIC_FILTER_IDS = new Set(['hwidDeviceLimit', 'id', 'trafficLimitBytes']);

type AllowedUsersFilterId = keyof typeof USERS_FILTER_COLUMN_MAP;

@Injectable()
export class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);

    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly userConverter: UserConverter,
    ) {}

    public async create(
        entity: BaseUserEntity,
        internalSquadUuids: string[] = [],
    ): Promise<{
        id: bigint;
    }> {
        const model = this.userConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.users.create({
            select: {
                id: true,
            },
            data: {
                ...model,
                traffic: {
                    create: {
                        usedTrafficBytes: 0,
                        lifetimeUsedTrafficBytes: 0,
                    },
                },
                activeInternalSquads: {
                    create: internalSquadUuids.map((internalSquadUuid) => ({
                        internalSquadUuid,
                    })),
                },
            },
        });

        return {
            id: result.id,
        };
    }

    public async bulkIncrementUsedTraffic(
        userUsageList: { u: string; b: string; n: string }[],
    ): Promise<{ id: bigint }[]> {
        const { query } = new BulkUpdateUserUsedTrafficBuilder(userUsageList);
        const result = await this.prisma.tx.$queryRaw<{ id: bigint }[]>(query);

        return result;
    }

    public async triggerThresholdNotifications(percentages: number[]): Promise<{ id: bigint }[]> {
        const { query } = new TriggerThresholdNotificationsBuilder(percentages);
        return await this.prisma.tx.$queryRaw<{ id: bigint }[]>(query);
    }

    public async updateStatusAndTrafficAndResetAt(
        id: bigint,
        lastResetAt: Date,
        status?: TUsersStatus,
    ): Promise<void> {
        await this.prisma.tx.users.update({
            where: { id },
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

    public async updateExceededTrafficUsers(): Promise<{ id: bigint }[]> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({ status: USERS_STATUS.LIMITED })
            .from('userTraffic')
            .whereRef('userTraffic.id', '=', 'users.id')
            .where('users.status', '=', USERS_STATUS.ACTIVE)
            .where('users.trafficLimitBytes', '!=', 0n)
            .whereRef('userTraffic.usedTrafficBytes', '>=', 'users.trafficLimitBytes')
            .returning(['users.id'])
            .execute();

        return result;
    }

    public async findUsersByExpireAt(start: Date, end: Date): Promise<{ id: bigint }[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select('id')
            .where('expireAt', '>=', start)
            .where('expireAt', '<=', end)
            .execute();
        return result.map((value) => ({ id: value.id }));
    }

    public async updateExpiredUsers(): Promise<{ id: bigint }[]> {
        // UPDATE "public"."users" SET "status" = $1, "updated_at" = $2 WHERE ("public"."users"."status" IN ($3,$4) AND "public"."users"."expire_at" < $5) RETURNING "public"."users"."uuid"
        const result = await this.prisma.tx.users.updateManyAndReturn({
            select: {
                id: true,
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

    private get baseUsersQb() {
        return this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.id', 'users.id');
    }

    public async getAllUsers({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetUsersQueryDto): Promise<[UserEntity[], number]> {
        let qb = this.baseUsersQb.selectAll().select((eb) => this.includeActiveInternalSquads(eb));

        if (filters?.length) {
            qb = this.applyUsersFilters(qb, filters, filterModes);
        }

        if (sorting?.length) {
            for (const sort of sorting) {
                if (sort.id === 'usedTrafficPercentage') {
                    qb = qb.orderBy(
                        (eb) =>
                            eb(
                                eb.cast<number>('userTraffic.usedTrafficBytes', 'numeric'),
                                '/',
                                eb.fn<number>('nullif', ['users.trafficLimitBytes', sql.lit(0)]),
                            ),
                        (ob) => (sort.desc ? ob.desc() : ob.asc()).nullsLast(),
                    );
                    continue;
                }

                const sortId = sort.id === 'id' ? 'users.id' : sort.id;
                qb = qb.orderBy(sql.ref(sortId), (ob) =>
                    (sort.desc ? ob.desc() : ob.asc()).nullsLast(),
                );
            }
        } else {
            qb = qb.orderBy('users.id', 'desc');
        }

        const { rows, count } = await paginateQuery(qb, { offset: start, limit: size });

        return [rows.map((u) => new UserEntity(u)), count];
    }

    public async getUsersStream(dto: GetUsersStreamQueryDto): Promise<{
        users: UserEntity[];
        nextCursor: string | null;
        hasMore: boolean;
    }> {
        const {
            cursor,
            size,
            status,
            trafficLimitStrategy,
            telegramId,
            email,
            tag,
            externalSquadUuid,
        } = dto;

        let qb = this.baseUsersQb.selectAll().select((eb) => this.includeActiveInternalSquads(eb));

        if (cursor) {
            qb = qb.where('users.id', '>', BigInt(cursor));
        }

        if (status) {
            qb = qb.where('users.status', '=', status);
        }
        if (trafficLimitStrategy) {
            qb = qb.where('users.trafficLimitStrategy', '=', trafficLimitStrategy);
        }
        if (telegramId !== undefined) {
            qb = qb.where('users.telegramId', '=', BigInt(telegramId));
        }
        if (email) {
            qb = qb.where('users.email', '=', email);
        }
        if (tag) {
            qb = qb.where('users.tag', '=', tag);
        }
        if (externalSquadUuid) {
            qb = qb.where('users.externalSquadUuid', '=', getKyselyUuid(externalSquadUuid));
        }

        const rows = await qb
            .orderBy('users.id', 'asc')
            .limit(size + 1)
            .execute();

        const hasMore = rows.length > size;
        if (hasMore) {
            rows.pop();
        }

        return {
            users: rows.map((u) => new UserEntity(u)),
            nextCursor: hasMore ? rows[rows.length - 1].id.toString() : null,
            hasMore,
        };
    }

    private applyUsersFilters(
        qb: any,
        filters: GetUsersQueryDto['filters'],
        filterModes?: GetUsersQueryDto['filterModes'],
    ) {
        for (const filter of filters ?? []) {
            if (!(filter.id in USERS_FILTER_COLUMN_MAP)) continue;
            if (Array.isArray(filter.value) && filter.value.length === 0) {
                continue;
            }

            const mode = filterModes?.[filter.id] ?? 'contains';

            if (
                ['createdAt', 'expireAt', 'lastTrafficResetAt', 'userTraffic.onlineAt'].includes(
                    filter.id,
                )
            ) {
                qb = qb.where(
                    USERS_FILTER_COLUMN_MAP[filter.id as AllowedUsersFilterId],
                    '=',
                    new Date(filter.value as string),
                );
                continue;
            }

            if (filter.id === 'id') {
                try {
                    BigInt(filter.value as string);
                    qb = qb.where(sql`CAST(users.id AS TEXT)`, 'like', `%${filter.value}%`);
                } catch {}
                continue;
            }

            if (filter.id === 'telegramId') {
                try {
                    BigInt(filter.value as string);
                    qb = qb.where(sql`CAST(telegram_id AS TEXT)`, 'like', `%${filter.value}%`);
                } catch {
                    qb = qb.where('telegramId', 'is', null);
                }
                continue;
            }

            if (filter.id === 'vlessUuid') {
                qb = qb.where(sql`"vless_uuid"::text`, 'ilike', `%${filter.value}%`);
                continue;
            }

            if (filter.id === 'externalSquadUuid') {
                qb = qb.where('externalSquadUuid', '=', getKyselyUuid(filter.value as string));
                continue;
            }

            if (filter.id === 'activeInternalSquads') {
                qb = qb.where('users.id', 'in', (eb: any) =>
                    eb
                        .selectFrom('internalSquadMembers')
                        .select('internalSquadMembers.userId')
                        .where(
                            'internalSquadMembers.internalSquadUuid',
                            '=',
                            getKyselyUuid(filter.value as string),
                        ),
                );
                continue;
            }

            if (filter.id === 'nodeName') {
                qb = qb.where(
                    'userTraffic.lastConnectedNodeUuid',
                    '=',
                    getKyselyUuid(filter.value as string),
                );
                continue;
            }

            const value = NUMERIC_FILTER_IDS.has(filter.id) ? Number(filter.value) : filter.value;

            const col = USERS_FILTER_COLUMN_MAP[filter.id as AllowedUsersFilterId];
            switch (mode) {
                case 'equals':
                    if (Array.isArray(filter.value) && filter.value.length > 0) {
                        qb = qb.where(col, 'in', filter.value);
                    } else {
                        qb = qb.where(col, '=', value);
                    }
                    break;
                case 'startsWith':
                    qb = qb.where(col, 'like', `${value}%`);
                    break;
                case 'endsWith':
                    qb = qb.where(col, 'like', `%${value}`);
                    break;
                case 'greaterThan':
                    qb = qb.where(col, '>', value);
                    break;
                case 'greaterThanOrEqualTo':
                    qb = qb.where(col, '>=', value);
                    break;
                case 'lessThan':
                    qb = qb.where(col, '<', value);
                    break;
                case 'lessThanOrEqualTo':
                    qb = qb.where(col, '<=', value);
                    break;
                case 'between': {
                    const [from, to] = filter.value as [string | null, string | null];
                    const castFn = NUMERIC_FILTER_IDS.has(filter.id) ? Number : (v: string) => v;
                    if (from !== null && from !== undefined && from !== '') {
                        qb = qb.where(col, '>=', castFn(from));
                    }
                    if (to !== null && to !== undefined && to !== '') {
                        qb = qb.where(col, '<=', castFn(to));
                    }
                    break;
                }
                default:
                    qb = qb.where(col, 'ilike', `%${value}%`);
            }
        }

        return qb;
    }

    public async getUsersWithPagination({
        start,
        size,
    }: {
        start: number;
        size: number;
    }): Promise<[UserEntity[], number]> {
        const [users, total] = await Promise.all([
            this.qb.kysely
                .selectFrom('users')
                .innerJoin('userTraffic', 'userTraffic.id', 'users.id')
                .selectAll()
                .select((eb) => this.includeActiveInternalSquads(eb))
                .offset(start)
                .limit(size)
                .orderBy('users.id', 'desc')
                .execute(),
            this.qb.kysely
                .selectFrom('users')
                .select((eb) => eb.fn.countAll().as('count'))
                .executeTakeFirstOrThrow(),
        ]);

        const usersResult = users.map((user) => new UserEntity(user));

        return [usersResult, Number(total.count)];
    }

    @Transactional()
    public async update(dto: IUpdateUserDto): Promise<UserEntity | null> {
        const { id, activeInternalSquads, ...data } = dto;

        await this.prisma.tx.users.update({
            select: {
                id: true,
            },
            where: { id },
            data,
        });

        if (activeInternalSquads) {
            await this.removeUserFromInternalSquads(id);
            await this.addUserToInternalSquads(id, activeInternalSquads);
        }

        return await this.findUniqueByCriteria({ id }, { activeInternalSquads: true });
    }

    public async updateUserStatus(id: bigint, status: TUsersStatus): Promise<boolean> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({ status })
            .where('id', '=', id)
            .clearReturning()
            .executeTakeFirstOrThrow();

        return !!result;
    }

    public async findUniqueByCriteria(
        dto: Partial<Pick<BaseUserEntity, 'shortUuid' | 'username' | 'id'>>,
        includeOptions: {
            activeInternalSquads: boolean;
        } = {
            activeInternalSquads: true,
        },
    ): Promise<UserEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.id', 'users.id')
            .selectAll()
            .$if(includeOptions.activeInternalSquads, (qb) =>
                qb.select((eb) => this.includeActiveInternalSquads(eb)),
            )
            .where((eb) => {
                if (dto.id !== undefined) return eb('users.id', '=', dto.id);
                if (dto.username !== undefined) return eb('username', '=', dto.username);
                if (dto.shortUuid !== undefined) return eb('shortUuid', '=', dto.shortUuid);

                throw new Error('findUniqueByCriteria: no criteria provided');
            })
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new UserEntity(result);
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

    public async deleteById(userId: bigint): Promise<boolean> {
        const result = await this.prisma.tx.users.delete({ where: { id: userId } });
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
                    .count('userTraffic.id')
                    .filterWhere('userTraffic.onlineAt', '>=', now.subtract(30, 'second').toDate())
                    .as('onlineNow'),
                eb.fn
                    .count('userTraffic.id')
                    .filterWhere('userTraffic.onlineAt', '>=', now.subtract(1, 'day').toDate())
                    .as('lastDay'),
                eb.fn
                    .count('userTraffic.id')
                    .filterWhere('userTraffic.onlineAt', '>=', now.subtract(1, 'week').toDate())
                    .as('lastWeek'),
                eb.fn
                    .count('userTraffic.id')
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

    public async resetUserTraffic(
        strategy: TResetPeriods,
        batchSize: number = 50_000,
    ): Promise<void> {
        let targetIdsQuery = this.qb.kysely
            .selectFrom('users')
            .select('id')
            .where('trafficLimitStrategy', '=', strategy)
            .where('status', '!=', USERS_STATUS.LIMITED)
            .orderBy('id');

        if (strategy === 'MONTH_ROLLING') {
            targetIdsQuery = targetIdsQuery
                .where(sql`("created_at" + interval '1 month')::date`, '<=', sql`CURRENT_DATE`)
                .where(
                    sql`LEAST(
                                EXTRACT(DAY FROM "created_at"),
                                EXTRACT(DAY FROM date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')
                            )`,
                    '=',
                    sql`EXTRACT(DAY FROM CURRENT_DATE)`,
                );
        }

        const targetIds = await targetIdsQuery.execute();

        this.logger.log(`Found ${targetIds.length} users with strategy ${strategy} to reset`);

        if (targetIds.length === 0) {
            return;
        }

        const startTime = getTime();

        const now = new Date();

        for (let i = 0; i < targetIds.length; i += batchSize) {
            const batchIds = targetIds.slice(i, i + batchSize);

            const batchStartTime = getTime();

            await this.qb.kysely
                .with('lockedUsers', (db) =>
                    db
                        .selectFrom('users')
                        .select('id')
                        .where(
                            sql<boolean>`"users"."id" = ANY(string_to_array(${batchIds.map((r) => r.id).join(',')}, ',')::bigint[])`,
                        )
                        .forUpdate(),
                )
                .with('updateUsers', (db) =>
                    db
                        .updateTable('users')
                        .from('lockedUsers')
                        .whereRef('users.id', '=', 'lockedUsers.id')
                        .set({
                            lastTrafficResetAt: now,
                            lastTriggeredThreshold: 0,
                        })
                        .returning('users.id'),
                )
                .updateTable('userTraffic')
                .from('updateUsers')
                .whereRef('userTraffic.id', '=', 'updateUsers.id')
                .set({ usedTrafficBytes: 0n })
                .execute();

            this.logger.log(
                `Reset batch ${i + batchSize} of ${targetIds.length} users in ${formatExecutionTime(batchStartTime)}`,
            );
        }

        this.logger.log(
            `Reset completed: ${targetIds.length} users in ${formatExecutionTime(startTime)} for strategy ${strategy}`,
        );
    }

    public async resetLimitedUserTraffic(strategy: TResetPeriods): Promise<{ id: bigint }[]> {
        let targetIdsQuery = this.qb.kysely
            .selectFrom('users')
            .select('id')
            .where('trafficLimitStrategy', '=', strategy)
            .where('status', '=', USERS_STATUS.LIMITED)
            .orderBy('id')
            .forUpdate();

        if (strategy === 'MONTH_ROLLING') {
            targetIdsQuery = targetIdsQuery
                .where(sql`("created_at" + interval '1 month')::date`, '<=', sql`CURRENT_DATE`)
                .where(
                    sql`LEAST(
                            EXTRACT(DAY FROM "created_at"),
                            EXTRACT(DAY FROM date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')
                        )`,
                    '=',
                    sql`EXTRACT(DAY FROM CURRENT_DATE)`,
                );
        }

        const result = await this.qb.kysely
            .with('targetUsers', () => targetIdsQuery)
            .with('updateUsers', (db) =>
                db
                    .updateTable('users')
                    .from('targetUsers')
                    .whereRef('users.id', '=', 'targetUsers.id')
                    .set({
                        lastTrafficResetAt: new Date(),
                        lastTriggeredThreshold: 0,
                        status: USERS_STATUS.ACTIVE,
                    })
                    .returning('users.id'),
            )
            .updateTable('userTraffic')
            .from('updateUsers')
            .whereRef('userTraffic.id', '=', 'updateUsers.id')
            .set({ usedTrafficBytes: 0n })
            .returning('userTraffic.id')
            .execute();

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
                .innerJoin('internalSquadMembers', 'internalSquadMembers.userId', 'users.id')
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
                .$if(lastTId !== null, (qb) => qb.where('users.id', '>', lastTId!))
                .where(
                    'internalSquadInbounds.inboundUuid',
                    'in',
                    activeInbounds.map((inbound) => getKyselyUuid(inbound.uuid)),
                )
                .select((eb) => [
                    'users.id',
                    'users.trojanPassword',
                    'users.vlessUuid',
                    'users.ssPassword',
                    sql<
                        string[]
                    >`coalesce(json_agg(DISTINCT ${eb.ref('configProfileInbounds.tag')}), '[]')`.as(
                        'tags',
                    ),
                ])
                .groupBy(['users.id'])
                .orderBy('users.id', 'asc')
                .limit(BATCH_SIZE);

            const startTime = getTime();
            const result = await builder.execute();
            this.logger.log(
                `[getUsersForConfigStream] ${formatExecutionTime(startTime)}, length: ${result.length}`,
            );

            if (result.length < BATCH_SIZE) {
                hasMoreData = false;
            }

            if (result.length > 0) {
                lastTId = result[result.length - 1].id;
                yield result;
            } else {
                break;
            }
        }
    }

    public async deleteManyByUserIds(userIds: bigint[]): Promise<number> {
        const result = await this.prisma.tx.users.deleteMany({
            where: { id: { in: userIds } },
        });

        return result.count;
    }

    public async getMinMaxBatchRange(batchSize = 10_000): Promise<{
        ranges: { min: bigint; max: bigint }[];
    }> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select((eb) => [eb.fn.min('users.id').as('min'), eb.fn.max('users.id').as('max')])
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
                .where('id', '>=', batch.min)
                .where('id', '<=', batch.max)
                .executeTakeFirst();
            if (result) {
                totalUpdated += Number(result.numUpdatedRows ?? 0n);
            }
        }
        return totalUpdated;
    }

    public async bulkExtendExpirationDateByUserIds(
        userIds: number[],
        extendDays: number,
    ): Promise<number> {
        const result = await this.qb.kysely
            .updateTable('users')
            .set({
                expireAt: sql`expire_at + (${extendDays}::int || ' days')::interval`,
            })
            .where(
                'id',
                'in',
                userIds.map((userId) => BigInt(userId)),
            )
            .executeTakeFirst();

        return Number(result?.numUpdatedRows ?? 0n);
    }

    public async bulkSyncExpiredUsersByUserIds(userIds: number[]): Promise<bigint[]> {
        const result = await this.prisma.tx.users.updateManyAndReturn({
            select: {
                id: true,
            },
            where: {
                id: {
                    in: userIds.map((userId) => BigInt(userId)),
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

        return result.map((user) => user.id);
    }

    public async bulkUpdateAllUsersByRange({
        fields,
    }: {
        fields: Partial<BaseUserEntity>;
    }): Promise<number> {
        const { ranges } = await this.getMinMaxBatchRange();

        if (ranges.length === 0) {
            return 0;
        }

        let totalUpdated = 0;
        for (const range of ranges) {
            const result = await this.prisma.tx.users.updateMany({
                where: { id: { gte: range.min, lte: range.max } },
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
            .whereRef('userTraffic.id', '=', 'users.id')
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

    public async getAllTags(): Promise<string[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select('tag')
            .where('tag', 'is not', null)
            .distinct()
            .limit(1000)
            .execute();

        return result.map((user) => user.tag).filter((tag) => tag !== null);
    }

    public async countByStatus(status: TUsersStatus): Promise<number> {
        const result = await this.prisma.tx.users.count({ where: { status } });

        return result;
    }

    public async removeUsersFromInternalSquads(usersIds: bigint[]): Promise<void> {
        await this.qb.kysely
            .deleteFrom('internalSquadMembers')
            .where(
                'userId',
                'in',
                usersIds.map((userId) => userId),
            )
            .execute();
    }

    public async addUsersToInternalSquads(
        usersIds: bigint[],
        internalSquadsUuids: string[],
    ): Promise<void> {
        await this.qb.kysely
            .insertInto('internalSquadMembers')
            .columns(['userId', 'internalSquadUuid'])
            .values(
                usersIds.flatMap((userId) =>
                    internalSquadsUuids.map((internalSquadUuid) => ({
                        userId,
                        internalSquadUuid: getKyselyUuid(internalSquadUuid),
                    })),
                ),
            )
            .execute();
    }

    public async validateUserIds(userIds: number[] | bigint[]): Promise<bigint[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select('id')
            .where(
                'id',
                'in',
                userIds.map((userId) => BigInt(userId)),
            )
            .execute();
        return result.map((user) => user.id);
    }

    public async getUsersByUserIds(userIds: number[]): Promise<UserEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.id', 'users.id')
            .selectAll()
            .where(
                'users.id',
                'in',
                userIds.map((userId) => BigInt(userId)),
            )
            .select((eb) => this.includeActiveInternalSquads(eb))
            .orderBy('users.id', 'asc')
            .execute();

        return result.map((user) => new UserEntity(user));
    }

    public async addUserToInternalSquads(
        userId: bigint,
        internalSquadUuids: string[],
    ): Promise<boolean> {
        if (internalSquadUuids.length === 0) {
            return true;
        }

        const result = await this.qb.kysely
            .insertInto('internalSquadMembers')
            .columns(['userId', 'internalSquadUuid'])
            .values(
                internalSquadUuids.map((internalSquadUuid) => ({
                    userId,
                    internalSquadUuid: getKyselyUuid(internalSquadUuid),
                })),
            )
            .onConflict((oc) => oc.doNothing())
            .clearReturning()
            .executeTakeFirst();

        return !!result;
    }

    public async removeUserFromInternalSquads(userId: bigint): Promise<void> {
        await this.qb.kysely
            .deleteFrom('internalSquadMembers')
            .where('userId', '=', userId)
            .clearReturning()
            .executeTakeFirst();
    }

    public async getPartialUserByUniqueFields<T extends SelectExpression<DB, 'users'>>(
        dto: Partial<Pick<BaseUserEntity, 'shortUuid' | 'username' | 'id'>>,
        select: T[],
    ) {
        const user = await this.qb.kysely
            .selectFrom('users')
            .select(select)
            .where((eb) => {
                if (dto.id !== undefined) return eb('users.id', '=', dto.id);
                if (dto.username !== undefined) return eb('username', '=', dto.username);
                if (dto.shortUuid !== undefined) return eb('shortUuid', '=', dto.shortUuid);

                throw new Error('findUniqueByCriteria: no criteria provided');
            })
            .executeTakeFirst();

        return user;
    }

    public async getUserTrafficById(id: bigint): Promise<UserTrafficEntity> {
        const result = await this.qb.kysely
            .selectFrom('userTraffic')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirstOrThrow();

        return new UserTrafficEntity(result);
    }

    public async revokeUserSubscription(
        dto: Pick<
            BaseUserEntity,
            | 'id'
            | 'trojanPassword'
            | 'vlessUuid'
            | 'ssPassword'
            | 'subRevokedAt'
            | 'shortUuid'
            | 'updatedAt'
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
                updatedAt: dto.updatedAt,
            })
            .where('id', '=', dto.id)
            .executeTakeFirst();

        return !!result;
    }

    public async getUserWithResolvedInbounds(
        id: bigint,
    ): Promise<UserWithResolvedInboundEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select((eb) => [
                'users.id',
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
                        .whereRef('internalSquadMembers.userId', '=', 'users.id'),
                )
                    .$notNull()
                    .as('inbounds'),
            ])
            .where('users.id', '=', id)
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new UserWithResolvedInboundEntity(result);
    }

    public async getUsersWithResolvedInbounds(
        ids: bigint[],
    ): Promise<UserWithResolvedInboundEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select((eb) => [
                'users.id',
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
                        .whereRef('internalSquadMembers.userId', '=', 'users.id'),
                )
                    .$notNull()
                    .as('inbounds'),
            ])
            .where(
                'users.id',
                'in',
                ids.map((id) => id),
            )
            .where('users.status', '=', USERS_STATUS.ACTIVE)
            .execute();

        return result.map((user) => new UserWithResolvedInboundEntity(user));
    }

    public async getUserAccessibleNodes(userId: bigint): Promise<IGetUserAccessibleNodesResponse> {
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
                join.onRef('ism.internalSquadUuid', '=', 'sq.uuid').on('ism.userId', '=', userId),
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
            .orderBy('n.viewPosition', 'asc')
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
                .whereRef('internalSquadMembers.userId', '=', 'users.id'),
        ).as('activeInternalSquads');
    }

    public async findNotConnectedUsers(startDate: Date, endDate: Date): Promise<UserEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('userTraffic', 'userTraffic.id', 'users.id')
            .selectAll()
            .where('status', '=', 'ACTIVE')
            .where('userTraffic.firstConnectedAt', 'is', null)
            .where('userTraffic.onlineAt', 'is', null)
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<', endDate)
            .execute();

        return result.map((value) => new UserEntity(value));
    }

    public async getUserSubpageConfigUuid(shortUuid: string): Promise<string | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .where('shortUuid', '=', shortUuid)
            .where('externalSquadUuid', 'is not', null)
            .innerJoin('externalSquads', 'users.externalSquadUuid', 'externalSquads.uuid')
            .select('externalSquads.subpageConfigUuid')
            .executeTakeFirst();

        if (!result || !result.subpageConfigUuid) {
            return null;
        }

        return result.subpageConfigUuid;
    }

    public async getUsersDigestByRange(
        start: Date,
        endExclusive: Date,
    ): Promise<{ createdCount: number; expiredCount: number }> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .select([
                sql<number>`count(*) filter (where created_at >= ${start} and created_at < ${endExclusive})::int`.as(
                    'createdCount',
                ),
                sql<number>`count(*) filter (where expire_at >= ${start} and expire_at < ${endExclusive})::int`.as(
                    'expiredCount',
                ),
            ])
            .executeTakeFirstOrThrow();

        return {
            createdCount: Number(result.createdCount),
            expiredCount: Number(result.expiredCount),
        };
    }

    public async getUsersRecap(): Promise<{ total: number; newUsersThisMonth: number }> {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const result = await this.qb.kysely
            .selectFrom('users')
            .select([
                sql<bigint>`count(*)::int`.as('total'),
                sql<bigint>`count(*) filter (where created_at >= ${startOfMonth})::int`.as(
                    'newUsersThisMonth',
                ),
            ])
            .executeTakeFirstOrThrow();

        return {
            total: Number(result.total),
            newUsersThisMonth: Number(result.newUsersThisMonth),
        };
    }
}
