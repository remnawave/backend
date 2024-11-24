import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/users.entity';
import { ICrud } from '@common/types/crud-port';
import { UserConverter } from '../users.converter';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { UserWithActiveInboundsEntity } from '../entities/user-with-active-inbounds.entity';
import { UserForConfigEntity } from '../entities/users-for-config';
import { TUsersStatus, USERS_STATUS } from '@contract/constants';

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
            data: { usedTrafficBytes: { increment: bytes }, onlineAt: new Date() },
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
    ): Promise<UserWithActiveInboundsEntity | null> {
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
    ): Promise<UserWithActiveInboundsEntity | null> {
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

    public async getAllUsersWithActiveInboundsWithPagination(
        limit: number,
        offset: number,
    ): Promise<UserWithActiveInboundsEntity[]> {
        const result = await this.prisma.tx.users.findMany({
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: 'asc',
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

    public async getUserByShortUuid(
        shortUuid: string,
    ): Promise<UserWithActiveInboundsEntity | null> {
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

    public async getUserByUUID(uuid: string): Promise<UserWithActiveInboundsEntity | null> {
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
    ): Promise<UserWithActiveInboundsEntity | null> {
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

    public async findByUUID(uuid: string): Promise<UserEntity | null> {
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

    public async findFirstByCriteria(dto: Partial<UserEntity>): Promise<UserEntity | null> {
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
}
