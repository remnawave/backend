import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

import { SumLifetimeUsageBuilder } from 'src/modules/users/builders/sum-lifetime-usage/sum-lifetime-usage.builder';
import { TUsersStatus, USERS_STATUS } from '@contract/constants';
import { GetAllUsersV2Command } from '@libs/contracts/commands';
import { ICrud } from '@common/types/crud-port';

import { UserWithLifetimeTrafficEntity } from '../entities/user-with-lifetime-traffic.entity';
import { UserWithActiveInboundsEntity } from '../entities/user-with-active-inbounds.entity';
import { IGetUsersOptions, IUserOnlineStats, IUserStats } from '../interfaces';
import { UserForConfigEntity } from '../entities/users-for-config';
import { UserEntity } from '../entities/users.entity';
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
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
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

    public async getUserWithActiveInbounds(
        uuid: string,
    ): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { uuid },
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
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

    public async findAllActiveUsers(): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            where: {
                status: USERS_STATUS.ACTIVE,
            },
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });
        return result.map((value) => new UserWithActiveInboundsEntity(value));
    }

    public async getUsersForConfig(): Promise<UserForConfigEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            where: {
                status: USERS_STATUS.ACTIVE,
            },
            select: {
                subscriptionUuid: true,
                username: true,
                trojanPassword: true,
                vlessUuid: true,
                ssPassword: true,
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                tag: true,
                            },
                        },
                    },
                },
            },
        });

        return result.flatMap((user) =>
            user.activeUserInbounds.map(
                (activeInbound) =>
                    new UserForConfigEntity({
                        subscriptionUuid: user.subscriptionUuid,
                        username: user.username,
                        trojanPassword: user.trojanPassword,
                        vlessUuid: user.vlessUuid,
                        ssPassword: user.ssPassword,
                        tag: activeInbound.inbound.tag,
                    }),
            ),
        );
    }

    public async getAllUsersWithActiveInbounds(): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });

        return result.map((value) => new UserWithActiveInboundsEntity(value));
    }

    // public async getAllUsersWithActiveInboundsWithPagination({
    //     limit,
    //     offset,
    //     orderBy,
    //     orderDir,
    //     search,
    //     searchBy,
    // }: IGetUsersOptions): Promise<[UserWithActiveInboundsEntity[], number]> {
    //     const where = search
    //         ? {
    //               [searchBy as string]: {
    //                   contains: search,
    //                   mode: 'insensitive' as const,
    //               },
    //           }
    //         : {};

    //     const [result, total] = await Promise.all([
    //         this.prisma.tx.users.findMany({
    //             skip: offset,
    //             take: limit,
    //             where,
    //             orderBy: {
    //                 [orderBy]: orderDir,
    //             },
    //             include: {
    //                 activeUserInbounds: {
    //                     select: {
    //                         inbound: {
    //                             select: {
    //                                 uuid: true,
    //                                 tag: true,
    //                                 type: true,
    //                             },
    //                         },
    //                     },
    //                 },
    //                 userTrafficHistory: {
    //                     _sum: {
    //                         usedBytes: true,
    //                     },
    //                 },
    //             },
    //         }),
    //         this.prisma.tx.users.count({ where }),
    //     ]);

    //     return [result.map((value) => new UserWithActiveInboundsEntity(value)), total];
    // }

    public async getAllUsersWithActiveInboundsWithPagination({
        limit,
        offset,
        orderBy,
        orderDir,
        search,
        searchBy,
    }: IGetUsersOptions): Promise<[UserWithLifetimeTrafficEntity[], number]> {
        const where = search
            ? {
                  [searchBy as string]: {
                      contains: search,
                      mode: 'insensitive' as const,
                  },
              }
            : {};

        const [trafficByUser, users, total] = await Promise.all([
            this.prisma.tx.$queryRaw<{ usedTrafficBytes: bigint; uuid: string }[]>(
                new SumLifetimeUsageBuilder().query,
            ),
            this.prisma.tx.users.findMany({
                skip: offset,
                take: limit,
                where,
                orderBy: {
                    [orderBy]: orderDir,
                },
                include: {
                    activeUserInbounds: {
                        select: {
                            inbound: {
                                select: {
                                    uuid: true,
                                    tag: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.tx.users.count({ where }),
        ]);

        const trafficMap = new Map(
            trafficByUser.map((item) => [item.uuid, item.usedTrafficBytes || BigInt(0)]),
        );

        const result = users.map((user) => {
            const totalUsedBytes = trafficMap.get(user.uuid) || BigInt(0);
            return new UserWithLifetimeTrafficEntity({
                ...user,
                totalUsedBytes,
            });
        });

        return [result, total];
    }

    public async getAllUsersV2({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetAllUsersV2Command.RequestQuery): Promise<[UserWithLifetimeTrafficEntity[], number]> {
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

            return {
                ...acc,
                [filter.id]: {
                    [mode]: filter.value,
                    mode: 'insensitive' as const,
                },
            };
        }, {});

        let orderBy = sorting?.length
            ? sorting
                  .filter((sort) => sort.id !== 'totalUsedBytes')
                  .reduce(
                      (acc, sort) => ({
                          ...acc,
                          [sort.id]: sort.desc ? 'desc' : 'asc',
                      }),
                      {},
                  )
            : undefined;

        if (orderBy === undefined) {
            orderBy = {
                createdAt: 'desc',
            };
        }

        const orderByByte =
            sorting?.find((sort) => sort.id === 'totalUsedBytes')?.desc !== undefined
                ? sorting.find((sort) => sort.id === 'totalUsedBytes')!.desc
                    ? 'desc'
                    : 'asc'
                : undefined;

        const [trafficByUser, users, total] = await Promise.all([
            this.prisma.tx.$queryRaw<{ usedTrafficBytes: bigint; uuid: string }[]>(
                new SumLifetimeUsageBuilder().query,
            ),
            this.prisma.tx.users.findMany({
                skip: start,
                take: size,
                where,
                orderBy,
                include: {
                    activeUserInbounds: {
                        select: {
                            inbound: {
                                select: {
                                    uuid: true,
                                    tag: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.tx.users.count({ where }),
        ]);

        const trafficMap = new Map(
            trafficByUser.map((item) => [item.uuid, item.usedTrafficBytes || BigInt(0)]),
        );

        const result = users.map((user) => {
            const totalUsedBytes = trafficMap.get(user.uuid) || BigInt(0);
            return new UserWithLifetimeTrafficEntity({
                ...user,
                totalUsedBytes,
            });
        });

        if (orderByByte) {
            result.sort((a, b) => {
                return orderByByte === 'desc'
                    ? Number(b.totalUsedBytes) - Number(a.totalUsedBytes)
                    : Number(a.totalUsedBytes) - Number(b.totalUsedBytes);
            });
        }

        return [result, total];
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
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
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

    public async getUserBySubscriptionUuid(
        subscriptionUuid: string,
    ): Promise<null | UserWithActiveInboundsEntity> {
        const result = await this.prisma.tx.users.findUnique({
            where: { subscriptionUuid },
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
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
            include: {
                activeUserInbounds: {
                    select: {
                        inbound: {
                            select: {
                                uuid: true,
                                tag: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });

        return new UserWithActiveInboundsEntity(result);
    }

    public async findByCriteria(dto: Partial<UserEntity>): Promise<UserEntity[]> {
        const bannerList = await this.prisma.tx.users.findMany({
            where: dto,
        });
        return this.userConverter.fromPrismaModelsToEntities(bannerList);
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
}
