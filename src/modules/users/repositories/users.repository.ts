import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { SelectExpression, sql, ExpressionBuilder } from 'kysely';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

import { TResetPeriods, TUsersStatus, USERS_STATUS } from '@contract/constants';
import { DB } from 'prisma/generated/types';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

import { TxKyselyService } from '@common/database/tx-kysely.service';
import { getKyselyUuid } from '@common/helpers/kysely';
import { ICrud } from '@common/types/crud-port';
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
import { UserConverter } from '../users.converter';

dayjs.extend(utc);

@Injectable()
export class UsersRepository implements ICrud<BaseUserEntity> {
    private readonly logger = new Logger(UsersRepository.name);

    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly userConverter: UserConverter,
    ) {}

    public async create(entity: BaseUserEntity): Promise<BaseUserEntity> {
        const model = this.userConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.users.create({
            data: model,
        });

        return this.userConverter.fromPrismaModelToEntity(result);
    }

    public async bulkIncrementUsedTraffic(
        userUsageList: { u: string; b: string; n: string }[],
    ): Promise<{ tId: bigint }[]> {
        const { query } = new BulkUpdateUserUsedTrafficBuilder(userUsageList);
        const result = await this.prisma.tx.$queryRaw<{ tId: bigint }[]>(query);

        return result;
    }

    public async triggerThresholdNotifications(percentages: number[]): Promise<{ uuid: string }[]> {
        const { query } = new TriggerThresholdNotificationsBuilder(percentages);
        return await this.prisma.tx.$queryRaw<{ uuid: string }[]>(query);
    }

    public async updateStatusAndTrafficAndResetAt(
        userUuid: string,
        lastResetAt: Date,
        status?: TUsersStatus,
    ): Promise<void> {
        await this.prisma.tx.users.update({
            where: { uuid: userUuid },
            data: {
                lastTrafficResetAt: lastResetAt,
                status,
                usedTrafficBytes: 0,
                lastTriggeredThreshold: 0,
            },
        });
    }

    public async updateSubLastOpenedAndUserAgent(
        userUuid: string,
        subLastOpenedAt: Date,
        subLastUserAgent: string,
    ): Promise<void> {
        await this.prisma.tx.users.update({
            where: { uuid: userUuid },
            data: { subLastOpenedAt, subLastUserAgent },
        });
    }

    public async updateExceededTrafficUsers(): Promise<{ uuid: string }[]> {
        const result = await this.prisma.tx.users.updateManyAndReturn({
            select: {
                uuid: true,
            },
            where: {
                AND: [
                    {
                        status: USERS_STATUS.ACTIVE,
                    },
                    {
                        trafficLimitBytes: {
                            not: 0,
                        },
                    },
                    {
                        usedTrafficBytes: {
                            gte: this.prisma.tx.users.fields.trafficLimitBytes,
                        },
                    },
                ],
            },
            data: {
                status: USERS_STATUS.LIMITED,
            },
        });

        return result;
    }

    public async findUsersByExpireAt(start: Date, end: Date): Promise<UserEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .selectAll()
            .select((eb) => this.includeActiveInternalSquads(eb))
            .select((eb) => this.includeLastConnectedNode(eb))
            .where('expireAt', '>=', start)
            .where('expireAt', '<=', end)
            .execute();
        return result.map((value) => new UserEntity(value));
    }

    public async updateExpiredUsers(): Promise<{ uuid: string }[]> {
        const result = await this.prisma.tx.users.updateManyAndReturn({
            select: {
                uuid: true,
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
        const qb = this.qb.kysely.selectFrom('users');

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
                        'onlineAt',
                        'subLastOpenedAt',
                    ].includes(filter.id)
                ) {
                    whereBuilder = whereBuilder.where(
                        filter.id as any,
                        '=',
                        new Date(filter.value as string),
                    );
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
                        'lastConnectedNodeUuid',
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
                sortBuilder = sortBuilder.orderBy(sql.ref(sort.id), (ob) => {
                    const orderBy = sort.desc ? ob.desc() : ob.asc();
                    return orderBy.nullsLast();
                });
            }
        } else {
            sortBuilder = sortBuilder.orderBy('createdAt', 'desc');
        }

        const query = sortBuilder
            .selectAll()
            .offset(start)
            .limit(size)
            .select((eb) => this.includeActiveInternalSquads(eb))
            .select((eb) => this.includeLastConnectedNode(eb));

        const { count } = await this.qb.kysely
            .selectFrom('users')
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
                            'onlineAt',
                            'subLastOpenedAt',
                        ].includes(filter.id)
                    ) {
                        countBuilder = countBuilder.where(
                            filter.id as keyof DB['users'],
                            '=',
                            new Date(filter.value as string),
                        );
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
                            'lastConnectedNodeUuid',
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
                .selectAll()
                .select((eb) => this.includeActiveInternalSquads(eb))
                .select((eb) => this.includeLastConnectedNode(eb))
                .offset(start)
                .limit(size)
                .orderBy('createdAt', 'desc')
                .execute(),
            this.qb.kysely
                .selectFrom('users')
                .select((eb) => eb.fn.countAll().as('count'))
                .executeTakeFirstOrThrow(),
        ]);

        const usersResult = users.map((user) => new UserEntity(user));

        return [usersResult, Number(total.count)];
    }

    public async findByUUID(uuid: string): Promise<null | BaseUserEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.userConverter.fromPrismaModelToEntity(result);
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

    public async findByCriteria(dto: Partial<BaseUserEntity>): Promise<BaseUserEntity[]> {
        const bannerList = await this.prisma.tx.users.findMany({
            where: dto,
        });
        return this.userConverter.fromPrismaModelsToEntities(bannerList);
    }

    public async findUniqueByCriteria(
        dto: Partial<Pick<BaseUserEntity, 'uuid' | 'shortUuid' | 'username' | 'tId'>>,
        includeOptions: {
            activeInternalSquads: boolean;
            lastConnectedNode: boolean;
        } = {
            activeInternalSquads: true,
            lastConnectedNode: true,
        },
    ): Promise<UserEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('users')
            .selectAll()
            .$if(includeOptions.activeInternalSquads, (qb) =>
                qb.select((eb) => this.includeActiveInternalSquads(eb)),
            )
            .$if(includeOptions.lastConnectedNode, (qb) =>
                qb.select((eb) => this.includeLastConnectedNode(eb)),
            )
            .where((eb) => {
                const conditions = [];

                if (dto.uuid) conditions.push(eb('uuid', '=', getKyselyUuid(dto.uuid)));
                if (dto.shortUuid) conditions.push(eb('shortUuid', '=', dto.shortUuid));
                if (dto.username) conditions.push(eb('username', '=', dto.username));
                if (dto.tId) conditions.push(eb('tId', '=', dto.tId));

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
            lastConnectedNode: boolean;
        } = {
            activeInternalSquads: true,
            lastConnectedNode: true,
        },
    ): Promise<UserEntity[]> {
        // TODO: check this
        const user = await this.qb.kysely
            .selectFrom('users')
            .selectAll()
            // .select((eb) => [
            //     this.includeActiveInternalSquads(eb),
            //     this.includeLastConnectedNode(eb),
            // ])
            .$if(includeOptions.activeInternalSquads, (qb) =>
                qb.select((eb) => this.includeActiveInternalSquads(eb)),
            )
            .$if(includeOptions.lastConnectedNode, (qb) =>
                qb.select((eb) => this.includeLastConnectedNode(eb)),
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
            .selectFrom('users')
            .select((eb) => [
                eb.fn
                    .count('users.tId')
                    .filterWhere('users.onlineAt', '>=', now.subtract(1, 'minute').toDate())
                    .as('onlineNow'),
                eb.fn
                    .count('users.tId')
                    .filterWhere('users.onlineAt', '>=', now.subtract(1, 'day').toDate())
                    .as('lastDay'),
                eb.fn
                    .count('users.tId')
                    .filterWhere('users.onlineAt', '>=', now.subtract(1, 'week').toDate())
                    .as('lastWeek'),
                eb.fn
                    .count('users.tId')
                    .filterWhere('users.onlineAt', 'is', null)
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
                    .select(['uuid', 'usedTrafficBytes'])
                    .where('trafficLimitStrategy', '=', strategy)
                    .where('status', '!=', USERS_STATUS.LIMITED),
            )
            .with('insertHistory', (db) =>
                db
                    .insertInto('userTrafficHistory')
                    .columns(['userUuid', 'usedBytes'])
                    .expression(db.selectFrom('usersToReset').select(['uuid', 'usedTrafficBytes'])),
            )
            .updateTable('users')
            .set({
                usedTrafficBytes: 0n,
                lastTrafficResetAt: new Date(),
                lastTriggeredThreshold: 0,
            })
            .where('uuid', 'in', (eb) => eb.selectFrom('usersToReset').select('uuid'))
            .execute();
    }

    public async resetLimitedUsersTraffic(strategy: TResetPeriods): Promise<{ uuid: string }[]> {
        const { query } = new BatchResetLimitedUsersUsageBuilder(strategy);
        const result = await this.prisma.tx.$queryRaw<{ uuid: string }[]>(query);

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
                    'users.username',
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
                    'users.username',
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

    public async bulkUpdateAllUsers(fields: Partial<BaseUserEntity>): Promise<number> {
        const result = await this.prisma.tx.users.updateMany({
            data: fields,
        });

        return result.count;
    }

    public async bulkSyncLimitedUsers(): Promise<number> {
        const result = await this.prisma.tx.users.updateMany({
            where: {
                status: 'LIMITED',
                OR: [
                    {
                        trafficLimitBytes: {
                            equals: 0n,
                        },
                    },
                    {
                        AND: [
                            {
                                trafficLimitBytes: { gt: 0n },
                            },
                            {
                                usedTrafficBytes: {
                                    lt: this.prisma.tx.users.fields.trafficLimitBytes,
                                },
                            },
                        ],
                    },
                    {
                        usedTrafficBytes: {
                            equals: 0n,
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
        const result = await this.prisma.tx.users.findMany({
            select: {
                tag: true,
            },
            distinct: ['tag'],
        });

        return result.map((user) => user.tag).filter((tag) => tag !== null);
    }

    public async countByStatus(status: TUsersStatus): Promise<number> {
        const result = await this.prisma.tx.users.count({ where: { status } });

        return result;
    }

    public async removeUsersFromInternalSquads(usersUuids: string[]): Promise<void> {
        // TODO: check this
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
        // TODO: check this
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
                'users.username',
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
            .selectAll()
            .where('status', '=', 'ACTIVE')
            .where('firstConnectedAt', 'is', null)
            .where('onlineAt', 'is', null)
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<', endDate)
            .execute();

        return result.map((value) => new UserEntity(value));
    }

    private includeLastConnectedNode(eb: ExpressionBuilder<DB, 'users'>) {
        return jsonObjectFrom(
            eb
                .selectFrom('nodes')
                .select(['name', 'countryCode'])
                .whereRef('nodes.uuid', '=', 'users.lastConnectedNodeUuid'),
        ).as('lastConnectedNode');
    }
}
