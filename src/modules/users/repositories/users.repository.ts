import { Prisma } from '@prisma/client';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

import { TResetPeriods, TUsersStatus, USERS_STATUS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrud } from '@common/types/crud-port';
import { GetAllUsersCommand } from '@libs/contracts/commands';

import { InboundsEntity } from '@modules/inbounds/entities';

import {
    BatchResetLimitedUsersUsageBuilder,
    BatchResetUsersUsageBuilder,
    BulkDeleteByStatusBuilder,
    BulkUpdateUserUsedTrafficBuilder,
    UsersWithInboundTagAndExcludedInboundsBuilder,
} from '../builders';
import {
    UserEntity,
    UserForConfigEntity,
    UserWithActiveInboundsAndLastConnectedNodeEntity,
    UserWithActiveInboundsEntity,
    UserWithAiAndLcnRawEntity,
} from '../entities';
import {
    INCLUDE_ACTIVE_USER_INBOUNDS,
    IUserOnlineStats,
    IUserStats,
    USER_INCLUDE_INBOUNDS,
    USER_INCLUDE_INBOUNDS_AND_LAST_CONNECTED_NODE,
} from '../interfaces';
import {
    ILastConnectedNodeFromBuilder,
    UsersLastConnectedNodeBuilder,
} from '../builders/last-connected-node';
import { UserConverter } from '../users.converter';

dayjs.extend(utc);

@Injectable()
export class UsersRepository implements ICrud<UserEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly userConverter: UserConverter,
    ) {}

    public async create(entity: UserEntity): Promise<UserEntity> {
        const model = this.userConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.users.create({
            data: model,
        });

        return this.userConverter.fromPrismaModelToEntity(result);
    }

    public async incrementUsedTraffic(userUuid: string, bytes: bigint): Promise<void> {
        await this.prisma.tx.users.update({
            where: { uuid: userUuid },
            data: {
                usedTrafficBytes: { increment: bytes },
                onlineAt: new Date(),
                lifetimeUsedTrafficBytes: { increment: bytes },
            },
        });
    }

    public async bulkIncrementUsedTraffic(
        userUsageList: { u: string; b: string }[],
    ): Promise<number> {
        const { query } = new BulkUpdateUserUsedTrafficBuilder(userUsageList);
        return await this.prisma.tx.$executeRaw<number>(query);
    }

    public async changeUserStatus(userUuid: string, status: TUsersStatus): Promise<void> {
        await this.prisma.tx.users.update({
            where: { uuid: userUuid },
            data: { status },
        });
    }

    public async updateStatusAndTrafficAndResetAt(
        userUuid: string,
        lastResetAt: Date,
        status?: TUsersStatus,
    ): Promise<void> {
        await this.prisma.tx.users.update({
            where: { uuid: userUuid },
            data: { lastTrafficResetAt: lastResetAt, status, usedTrafficBytes: 0 },
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

    public async findUserByUsername(
        username: string,
    ): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { username },
            include: USER_INCLUDE_INBOUNDS,
        });

        if (!result) {
            return null;
        }

        return new UserWithActiveInboundsEntity(result);
    }

    public async findUserByUuid(uuid: string): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { uuid },
            include: USER_INCLUDE_INBOUNDS,
        });

        if (!result) {
            return null;
        }

        return new UserWithActiveInboundsEntity(result);
    }

    public async getUserWithActiveInbounds(
        uuid: string,
    ): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { uuid },
            include: USER_INCLUDE_INBOUNDS,
        });

        if (!result) {
            return null;
        }

        return new UserWithActiveInboundsEntity(result);
    }

    public async findAllActiveUsers(): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            where: {
                status: USERS_STATUS.ACTIVE,
            },
            include: USER_INCLUDE_INBOUNDS,
        });
        return result.map((value) => new UserWithActiveInboundsEntity(value));
    }

    public async findExceededTrafficUsers(): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
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
            include: USER_INCLUDE_INBOUNDS,
        });
        return result.map((value) => new UserWithActiveInboundsEntity(value));
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

    public async findExpiredUsers(): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            where: {
                AND: [
                    {
                        status: USERS_STATUS.ACTIVE,
                    },
                    {
                        expireAt: {
                            lt: new Date(),
                        },
                    },
                ],
            },
            include: USER_INCLUDE_INBOUNDS,
        });
        return result.map((value) => new UserWithActiveInboundsEntity(value));
    }

    public async findUsersByExpireAt(
        start: Date,
        end: Date,
    ): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            where: {
                expireAt: {
                    gte: start,
                    lte: end,
                },
            },
            include: USER_INCLUDE_INBOUNDS,
        });
        return result.map((value) => new UserWithActiveInboundsEntity(value));
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

    public async getAllUsersByTrafficStrategyAndStatus(
        strategy: TResetPeriods,
        status: TUsersStatus,
    ): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            where: {
                trafficLimitStrategy: strategy,
                status: status,
            },
            include: USER_INCLUDE_INBOUNDS,
        });

        return result.map((value) => new UserWithActiveInboundsEntity(value));
    }

    public async getUsersForConfig(
        excludedInbounds: InboundsEntity[],
    ): Promise<UserForConfigEntity[]> {
        const { query } = new UsersWithInboundTagAndExcludedInboundsBuilder(excludedInbounds);
        return await this.prisma.tx.$queryRaw<UserForConfigEntity[]>(query);
    }

    public async getAllUsersWithActiveInbounds(): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            include: USER_INCLUDE_INBOUNDS,
        });

        return result.map((value) => new UserWithActiveInboundsEntity(value));
    }

    public async getAllUsersV2({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetAllUsersCommand.RequestQuery): Promise<[UserWithAiAndLcnRawEntity[], number]> {
        const where = filters?.reduce((acc, filter) => {
            const mode = filterModes?.[filter.id] || 'contains';

            if (
                filter.id === 'expireAt' ||
                filter.id === 'createdAt' ||
                filter.id === 'lastTrafficResetAt' ||
                filter.id === 'subLastOpenedAt' ||
                filter.id === 'onlineAt'
            ) {
                return {
                    ...acc,
                    [filter.id]: {
                        equals: new Date(filter.value as string),
                    },
                };
            }

            if (filter.id === 'telegramId') {
                try {
                    const numValue = BigInt(filter.value as string);
                    return {
                        ...acc,
                        [filter.id]: {
                            equals: numValue,
                        },
                    };
                } catch {
                    return {
                        ...acc,
                        [filter.id]: {
                            equals: null,
                        },
                    };
                }
            }

            return {
                ...acc,
                [filter.id]: {
                    [mode]: filter.value,
                    mode: 'insensitive' as const,
                },
            };
        }, {});

        let orderBy = sorting?.reduce((acc, sort) => {
            const dateFields = [
                'lastTrafficResetAt',
                'subLastOpenedAt',
                'subRevokedAt',
                'onlineAt',
            ];

            if (dateFields.includes(sort.id)) {
                return {
                    ...acc,
                    [sort.id]: {
                        sort: sort.desc ? 'desc' : 'asc',
                        nulls: 'last',
                    },
                };
            }

            return {
                ...acc,
                [sort.id]: sort.desc ? 'desc' : 'asc',
            };
        }, {});

        if (orderBy === undefined || Object.keys(orderBy).length === 0) {
            orderBy = {
                createdAt: 'desc',
            };
        }

        const [users, total] = await Promise.all([
            this.prisma.tx.users.findMany({
                skip: start,
                take: size,
                where,
                orderBy,
                include: INCLUDE_ACTIVE_USER_INBOUNDS,
            }),
            this.prisma.tx.users.count({ where }),
        ]);

        let histories: ILastConnectedNodeFromBuilder[] = [];
        if (users.length > 0) {
            const { query } = new UsersLastConnectedNodeBuilder(users.map((u) => u.uuid));
            histories = await this.prisma.tx.$queryRaw<ILastConnectedNodeFromBuilder[]>(query);
        }

        const historyMap = new Map(
            histories.map((h) => [
                h.userUuid,
                { nodeName: h.nodeName, connectedAt: h.connectedAt },
            ]),
        );

        const result = users.map((user) => {
            const lastHistory = historyMap.get(user.uuid);
            return new UserWithAiAndLcnRawEntity({
                ...user,
                lastConnectedNode: lastHistory,
            });
        });

        return [result, total];
    }

    public async getUsersWithPagination({
        start,
        size,
    }: GetAllUsersCommand.RequestQuery): Promise<[UserWithActiveInboundsEntity[], number]> {
        const [users, total] = await Promise.all([
            this.prisma.tx.users.findMany({
                skip: start,
                take: size,

                orderBy: {
                    createdAt: 'desc',
                },
                include: INCLUDE_ACTIVE_USER_INBOUNDS,
            }),
            this.prisma.tx.users.count(),
        ]);

        const usersResult = users.map((user) => new UserWithActiveInboundsEntity(user));

        return [usersResult, total];
    }

    public async getUserByShortUuid(
        shortUuid: string,
    ): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { shortUuid },
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
                                network: true,
                                security: true,
                            },
                        },
                    },
                },
            },
        });

        if (!result) {
            return null;
        }

        return new UserWithActiveInboundsEntity(result);
    }

    public async getUserByUUID(uuid: string): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { uuid },
            include: USER_INCLUDE_INBOUNDS,
        });

        if (!result) {
            return null;
        }

        return new UserWithActiveInboundsEntity(result);
    }

    public async getUserBySubscriptionUuid(
        subscriptionUuid: string,
    ): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { subscriptionUuid },
            include: USER_INCLUDE_INBOUNDS,
        });

        if (!result) {
            return null;
        }

        return new UserWithActiveInboundsEntity(result);
    }

    public async findByUUID(uuid: string): Promise<null | UserEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.userConverter.fromPrismaModelToEntity(result);
    }

    public async update({ uuid, ...data }: Partial<UserEntity>): Promise<UserEntity> {
        const result = await this.prisma.tx.users.update({
            where: {
                uuid,
            },
            data,
        });

        return this.userConverter.fromPrismaModelToEntity(result);
    }

    public async updateUserWithActiveInbounds({
        uuid,
        ...data
    }: Partial<UserWithActiveInboundsEntity>): Promise<UserWithActiveInboundsEntity> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { activeUserInbounds: _, ...updateData } = data;

        const result = await this.prisma.tx.users.update({
            where: { uuid },
            data: updateData,
            include: USER_INCLUDE_INBOUNDS,
        });

        return new UserWithActiveInboundsEntity(result);
    }

    public async findByCriteria(dto: Partial<UserEntity>): Promise<UserEntity[]> {
        const bannerList = await this.prisma.tx.users.findMany({
            where: dto,
        });
        return this.userConverter.fromPrismaModelsToEntities(bannerList);
    }

    public async findUniqueByCriteria(
        dto: Partial<Pick<UserEntity, 'uuid' | 'subscriptionUuid' | 'shortUuid' | 'username'>>,
    ): Promise<UserWithActiveInboundsAndLastConnectedNodeEntity | null> {
        const user = await this.prisma.tx.users.findFirst({
            where: dto,
            include: USER_INCLUDE_INBOUNDS_AND_LAST_CONNECTED_NODE,
        });

        if (!user) {
            return null;
        }

        return new UserWithActiveInboundsAndLastConnectedNodeEntity(user);
    }

    public async findByCriteriaWithInboundsAndLastConnectedNode(
        dto: Partial<UserEntity>,
    ): Promise<UserWithActiveInboundsAndLastConnectedNodeEntity[]> {
        const bannerList = await this.prisma.tx.users.findMany({
            where: dto,
            include: USER_INCLUDE_INBOUNDS_AND_LAST_CONNECTED_NODE,
        });
        return bannerList.map((user) => new UserWithActiveInboundsAndLastConnectedNodeEntity(user));
    }

    public async findFirstByCriteria(dto: Partial<UserEntity>): Promise<null | UserEntity> {
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
        const [statusCounts, totalTraffic] = await Promise.all([
            this.prisma.tx.users.groupBy({
                by: ['status'],
                _count: {
                    status: true,
                },
                where: {
                    status: {
                        in: Object.values(USERS_STATUS),
                    },
                },
            }),

            this.prisma.tx.nodesUserUsageHistory.aggregate({
                _sum: {
                    totalBytes: true,
                },
            }),
        ]);

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
            totalTrafficBytes: totalTraffic._sum.totalBytes || BigInt(0),
        };
    }

    public async getUserOnlineStats(): Promise<IUserOnlineStats> {
        const now = dayjs().utc();
        const oneMinuteAgo = now.subtract(1, 'minute').toDate();
        const oneDayAgo = now.subtract(1, 'day').toDate();
        const oneWeekAgo = now.subtract(1, 'week').toDate();

        const [result] = await this.prisma.tx.$queryRaw<[IUserOnlineStats]>`
            SELECT 
                COUNT(CASE WHEN "online_at" >= ${oneMinuteAgo} THEN 1 END) as "onlineNow",
                COUNT(CASE WHEN "online_at" >= ${oneDayAgo} THEN 1 END) as "lastDay",
                COUNT(CASE WHEN "online_at" >= ${oneWeekAgo} THEN 1 END) as "lastWeek",
                COUNT(CASE WHEN "online_at" IS NULL THEN 1 END) as "neverOnline"
            FROM users
        `;

        return {
            onlineNow: Number(result.onlineNow),
            lastDay: Number(result.lastDay),
            lastWeek: Number(result.lastWeek),
            neverOnline: Number(result.neverOnline),
        };
    }

    public async resetUserTraffic(strategy: TResetPeriods): Promise<void> {
        const { query } = new BatchResetUsersUsageBuilder(strategy);
        await this.prisma.tx.$executeRaw<void>(query);

        return;
    }

    public async resetLimitedUsersTraffic(strategy: TResetPeriods): Promise<{ uuid: string }[]> {
        const { query } = new BatchResetLimitedUsersUsageBuilder(strategy);
        const result = await this.prisma.tx.$queryRaw<{ uuid: string }[]>(query);

        return result;
    }

    public async deleteManyByStatus(status: TUsersStatus): Promise<number> {
        const { query } = new BulkDeleteByStatusBuilder(status);

        const result = await this.prisma.tx.$executeRaw<unknown>(query);

        return result || 0;
    }

    public async *getUsersForConfigStream(
        excludedInbounds: InboundsEntity[],
    ): AsyncGenerator<UserForConfigEntity[]> {
        const BATCH_SIZE = 10_000;
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const builder = new UsersWithInboundTagAndExcludedInboundsBuilder(excludedInbounds);

            const query = Prisma.sql`
                ${builder.query}
                LIMIT ${BATCH_SIZE} OFFSET ${offset}
            `;

            const result = await this.prisma.tx.$queryRaw<UserForConfigEntity[]>(query);

            if (result.length < BATCH_SIZE) {
                hasMoreData = false;
            }

            if (result.length > 0) {
                yield result;
                offset += result.length;
            } else {
                break;
            }
        }
    }

    public async getUsersForConfigBatch(
        excludedInbounds: InboundsEntity[],
        limit: number,
        offset: number,
    ): Promise<UserForConfigEntity[]> {
        const builder = new UsersWithInboundTagAndExcludedInboundsBuilder(excludedInbounds);

        const query = Prisma.sql`
            ${builder.query}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const result = await this.prisma.tx.$queryRaw<UserForConfigEntity[]>(query);

        return result;
    }

    public async deleteManyByUuid(uuids: string[]): Promise<number> {
        const result = await this.prisma.tx.users.deleteMany({ where: { uuid: { in: uuids } } });

        return result.count;
    }

    public async bulkUpdateAllUsers(fields: Partial<UserEntity>): Promise<number> {
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
                        usedTrafficBytes: {
                            lt: this.prisma.tx.users.fields.trafficLimitBytes,
                        },
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

    public async bulkUpdateUsers(uuids: string[], fields: Partial<UserEntity>): Promise<number> {
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
}
