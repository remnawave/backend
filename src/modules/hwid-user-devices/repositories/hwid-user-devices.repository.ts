import { sql } from 'kysely';

import { DB } from 'prisma/generated/types';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrudWithStringId } from '@common/types/crud-port';
import { TxKyselyService } from '@common/database';
import { GetAllHwidDevicesCommand } from '@libs/contracts/commands';

import { HwidUserDeviceEntity } from '../entities/hwid-user-device.entity';
import { HwidUserDevicesConverter } from '../hwid-user-devices.converter';

@Injectable()
export class HwidUserDevicesRepository implements Omit<
    ICrudWithStringId<HwidUserDeviceEntity>,
    'deleteById' | 'findById' | 'update'
> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly converter: HwidUserDevicesConverter,
    ) {}

    public async create(entity: HwidUserDeviceEntity): Promise<HwidUserDeviceEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.hwidUserDevices.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async upsert(entity: HwidUserDeviceEntity): Promise<HwidUserDeviceEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.hwidUserDevices.upsert({
            where: { hwid_userUuid: { hwid: entity.hwid, userUuid: entity.userUuid } },
            update: { ...model, updatedAt: new Date() },
            create: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<HwidUserDeviceEntity>,
    ): Promise<HwidUserDeviceEntity[]> {
        const list = await this.prisma.tx.hwidUserDevices.findMany({
            where: dto,
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async findFirstByCriteria(
        dto: Partial<HwidUserDeviceEntity>,
    ): Promise<HwidUserDeviceEntity | null> {
        const result = await this.prisma.tx.hwidUserDevices.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async countByUserUuid(userUuid: string): Promise<number> {
        return await this.prisma.tx.hwidUserDevices.count({
            where: { userUuid },
        });
    }

    public async checkHwidExists(hwid: string, userUuid: string): Promise<boolean> {
        const count = await this.prisma.tx.hwidUserDevices.count({
            where: { hwid, userUuid },
        });
        return count > 0;
    }

    public async deleteByHwidAndUserUuid(hwid: string, userUuid: string): Promise<boolean> {
        const result = await this.prisma.tx.hwidUserDevices.delete({
            where: { hwid_userUuid: { hwid, userUuid } },
        });
        return !!result;
    }

    public async deleteByUserUuid(userUuid: string): Promise<boolean> {
        const result = await this.prisma.tx.hwidUserDevices.deleteMany({
            where: { userUuid },
        });
        return !!result;
    }

    public async getAllHwidDevices({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetAllHwidDevicesCommand.RequestQuery): Promise<[HwidUserDeviceEntity[], number]> {
        const qb = this.qb.kysely.selectFrom('hwidUserDevices');

        let isFiltersEmpty = true;

        let whereBuilder = qb;

        if (filters?.length) {
            isFiltersEmpty = false;
            for (const filter of filters) {
                const mode = filterModes?.[filter.id] || 'contains';

                if (['createdAt', 'expireAt'].includes(filter.id)) {
                    whereBuilder = whereBuilder.where(
                        filter.id as any,
                        '=',
                        new Date(filter.value as string),
                    );
                    continue;
                }

                const field = filter.id as keyof DB['hwidUserDevices'];

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
            sortBuilder = sortBuilder.orderBy('createdAt', 'desc');
        }

        const query = sortBuilder.selectAll().offset(start).limit(size);

        const { count } = await this.qb.kysely
            .selectFrom('hwidUserDevices')
            .select((eb) => eb.fn.countAll().as('count'))
            .$if(!isFiltersEmpty, (qb) => {
                let countBuilder = qb;
                for (const filter of filters!) {
                    const mode = filterModes?.[filter.id] || 'contains';

                    if (['createdAt', 'expireAt'].includes(filter.id)) {
                        countBuilder = countBuilder.where(
                            filter.id as keyof DB['hwidUserDevices'],
                            '=',
                            new Date(filter.value as string),
                        );
                        continue;
                    }

                    const field = filter.id as keyof DB['hwidUserDevices'];

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

        const result = users.map((u) => new HwidUserDeviceEntity(u));
        return [result, Number(count)];
    }

    public async getHwidDevicesStats(): Promise<{
        byPlatform: { platform: string; count: number }[];
        byApp: { app: string; count: number }[];
        stats: {
            totalUniqueDevices: number;
            totalHwidDevices: number;
            averageHwidDevicesPerUser: number;
        };
    }> {
        const platformStats = await this.qb.kysely
            .selectFrom('hwidUserDevices')
            .select(['platform', (eb) => eb.fn.count('hwid').as('count')])
            .where('platform', 'is not', null)
            .groupBy('platform')
            .orderBy('count', 'desc')
            .execute();

        const appStats = await this.qb.kysely
            .selectFrom('hwidUserDevices')
            .select([
                sql<string>`SPLIT_PART("user_agent", '/', 1)`.as('app'),
                (eb) => eb.fn.count('hwid').as('count'),
            ])
            .where('userAgent', 'is not', null)
            .groupBy(sql`SPLIT_PART("user_agent", '/', 1)`)
            .orderBy('count', 'desc')
            .execute();

        const totalStats = await this.qb.kysely
            .selectFrom('hwidUserDevices')
            .select([
                (eb) => eb.fn.count('hwid').as('totalHwidDevices'),
                (eb) => eb.fn.count(sql`DISTINCT hwid`).as('totalUniqueDevices'),
                (eb) => eb.fn.count(sql`DISTINCT "user_uuid"`).as('totalUsers'),
            ])
            .executeTakeFirstOrThrow();

        let averageHwidDevicesPerUser = 0;
        if (Number(totalStats.totalUsers) > 0) {
            averageHwidDevicesPerUser =
                Number(totalStats.totalHwidDevices) / Number(totalStats.totalUsers);
        }

        return {
            byPlatform: platformStats.map((stat) => ({
                platform: stat.platform || 'Unknown',
                count: Number(stat.count),
            })),
            byApp: appStats
                .filter((stat) => !stat.app.startsWith('https:'))
                .map((stat) => ({
                    app: stat.app,
                    count: Number(stat.count),
                })),
            stats: {
                totalUniqueDevices: Number(totalStats.totalUniqueDevices),
                totalHwidDevices: Number(totalStats.totalHwidDevices),
                averageHwidDevicesPerUser: Math.round(averageHwidDevicesPerUser * 100) / 100,
            },
        };
    }

    public async getTopUsersByHwidDevices({ start, size }: { start: number; size: number }) {
        const query = this.qb.kysely
            .selectFrom('hwidUserDevices as d')
            .innerJoin('users as u', 'u.uuid', 'd.userUuid')
            .select([
                'u.uuid as userUuid',
                'u.tId as id',
                'u.username',
                (eb) => eb.fn.count('d.hwid').as('devicesCount'),
            ])
            .groupBy(['u.uuid', 'u.tId', 'u.username'])
            .orderBy('devicesCount', 'desc')
            .offset(start)
            .limit(size);

        const countQuery = this.qb.kysely
            .selectFrom('hwidUserDevices')
            .select((eb) => eb.fn.count(eb.fn('distinct', ['userUuid'])).as('count'))
            .executeTakeFirstOrThrow();

        const [users, { count }] = await Promise.all([query.execute(), countQuery]);

        return {
            users: users.map((u) => ({
                ...u,
                id: Number(u.id),
                devicesCount: Number(u.devicesCount),
            })),
            total: Number(count),
        };
    }
}
