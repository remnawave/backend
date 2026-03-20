import { sql } from 'kysely';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ICrudWithStringId } from '@common/types/crud-port';
import { TxKyselyService } from '@common/database';
import { paginateQuery } from '@common/helpers';
import { GetAllHwidDevicesCommand } from '@libs/contracts/commands';

import { HwidUserDeviceEntity } from '../entities/hwid-user-device.entity';
import { HwidUserDevicesConverter } from '../hwid-user-devices.converter';

const HWID_FILTER_COLUMN_MAP = {
    userUuid: sql`"user_uuid"::text`,
    hwid: sql.ref('hwid_user_devices.hwid'),
    platform: sql.ref('hwid_user_devices.platform'),
    userAgent: sql.ref('hwid_user_devices.user_agent'),
    osVersion: sql.ref('hwid_user_devices.os_version'),
    deviceModel: sql.ref('hwid_user_devices.device_model'),
} as const;

type AllowedHwidFilterId = keyof typeof HWID_FILTER_COLUMN_MAP;

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
            orderBy: {
                createdAt: 'desc',
            },
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
        let qb = this.qb.kysely.selectFrom('hwidUserDevices').selectAll();

        if (filters?.length) {
            qb = this.applyHwidFilters(qb, filters, filterModes);
        }

        if (sorting?.length) {
            for (const sort of sorting) {
                qb = qb.orderBy(sql.ref(sort.id), (ob) =>
                    (sort.desc ? ob.desc() : ob.asc()).nullsLast(),
                ) as typeof qb;
            }
        } else {
            qb = qb.orderBy('createdAt', 'desc');
        }

        const { rows, count } = await paginateQuery(qb, { offset: start, limit: size });

        return [rows.map((u) => new HwidUserDeviceEntity(u)), count];
    }

    private applyHwidFilters(
        qb: any,
        filters: GetAllHwidDevicesCommand.RequestQuery['filters'],
        filterModes?: GetAllHwidDevicesCommand.RequestQuery['filterModes'],
    ) {
        for (const filter of filters ?? []) {
            if (!(filter.id in HWID_FILTER_COLUMN_MAP)) continue;

            const column = HWID_FILTER_COLUMN_MAP[filter.id as AllowedHwidFilterId];
            const mode = filterModes?.[filter.id] ?? 'contains';

            if (filter.id === 'createdAt' || filter.id === 'expireAt') {
                qb = qb.where(column, '=', new Date(filter.value as string));
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
