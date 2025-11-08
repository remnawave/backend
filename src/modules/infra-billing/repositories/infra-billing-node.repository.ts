import { sql } from 'kysely';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { ICrud } from '@common/types/crud-port';

import {
    InfraAvailableBillingNodeEntity,
    InfraBillingNodeEntity,
    InfraBillingNodeNotificationEntity,
} from '../entities';
import { NOTIFICATION_CONFIGS, TBillingNodeNotificationType } from '../interfaces';
import { InfraBillingNodeConverter } from '../converters';

@Injectable()
export class InfraBillingNodeRepository implements ICrud<InfraBillingNodeEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly infraBillingNodeConverter: InfraBillingNodeConverter,
    ) {}

    public async create(entity: InfraBillingNodeEntity): Promise<InfraBillingNodeEntity> {
        const model = this.infraBillingNodeConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.infraBillingNodes.create({
            data: model,
        });

        return this.infraBillingNodeConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<InfraBillingNodeEntity | null> {
        const result = await this.prisma.tx.infraBillingNodes.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.infraBillingNodeConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<InfraBillingNodeEntity>): Promise<InfraBillingNodeEntity> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { provider, node, ...rest } = data;
        const result = await this.prisma.tx.infraBillingNodes.update({
            where: {
                uuid,
            },
            data: rest,
        });

        return this.infraBillingNodeConverter.fromPrismaModelToEntity(result);
    }

    public async updateManyBillingAt({
        uuids,
        nextBillingAt,
    }: {
        uuids: string[];
        nextBillingAt: Date;
    }): Promise<boolean> {
        const result = await this.prisma.tx.infraBillingNodes.updateMany({
            where: {
                uuid: { in: uuids },
            },
            data: { nextBillingAt },
        });

        return !!result;
    }

    public async findByCriteria(
        dto: Partial<InfraBillingNodeEntity>,
    ): Promise<InfraBillingNodeEntity[]> {
        const infraBillingNodeList = await this.prisma.tx.infraBillingNodes.findMany({
            where: dto,
        });
        return this.infraBillingNodeConverter.fromPrismaModelsToEntities(infraBillingNodeList);
    }

    public async findFirstByCriteria(
        dto: Partial<InfraBillingNodeEntity>,
    ): Promise<InfraBillingNodeEntity | null> {
        const result = await this.prisma.tx.infraBillingNodes.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.infraBillingNodeConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.infraBillingNodes.delete({ where: { uuid } });
        return !!result;
    }

    public async getBillingNodes(): Promise<InfraBillingNodeEntity[]> {
        const result = await this.prisma.tx.infraBillingNodes.findMany({
            include: {
                provider: {
                    select: {
                        uuid: true,
                        name: true,
                        faviconLink: true,
                        loginUrl: true,
                    },
                },
                node: {
                    select: {
                        uuid: true,
                        name: true,
                        countryCode: true,
                    },
                },
            },
            orderBy: {
                nextBillingAt: 'asc',
            },
        });

        return this.infraBillingNodeConverter.fromPrismaModelsToEntities(result);
    }

    public async getAvailableBillingNodes(): Promise<InfraAvailableBillingNodeEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('nodes as n')
            .leftJoin('infraBillingNodes as ibn', 'ibn.nodeUuid', 'n.uuid')
            .select(['n.uuid', 'n.name', 'n.countryCode'])
            .where('ibn.nodeUuid', 'is', null)
            .orderBy('n.viewPosition', 'asc')
            .execute();

        return result.map((node) => new InfraAvailableBillingNodeEntity(node));
    }

    public async getInfraSummary(): Promise<{
        upcomingNodesCount: number;
        currentMonthPayments: number;
        totalSpent: number;
    }> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [upcomingNodes, currentMonthPayments, totalSpent] = await Promise.all([
            this.qb.kysely
                .selectFrom('infraBillingNodes')
                .select((eb) => eb.fn.count('uuid').as('count'))
                .where('nextBillingAt', '>=', today)
                .where('nextBillingAt', '<', startOfNextMonth)
                .executeTakeFirst(),

            this.qb.kysely
                .selectFrom('infraBillingHistory')
                .select(() => sql<number>`coalesce(round(sum(amount)::numeric, 2), 0)`.as('amount'))
                .where('billedAt', '>=', startOfMonth)
                .where('billedAt', '<', startOfNextMonth)
                .executeTakeFirst(),

            this.qb.kysely
                .selectFrom('infraBillingHistory')
                .select(() => sql<number>`coalesce(round(sum(amount)::numeric, 2), 0)`.as('amount'))
                .executeTakeFirst(),
        ]);

        const result = {
            upcomingNodesCount: Number(upcomingNodes?.count || 0),
            currentMonthPayments: Number(currentMonthPayments?.amount || 0),
            totalSpent: Number(totalSpent?.amount || 0),
        };

        return result;
    }

    public async getNotificationsByType(
        notificationType: string,
    ): Promise<InfraBillingNodeNotificationEntity[]> {
        if (!NOTIFICATION_CONFIGS[notificationType as TBillingNodeNotificationType]) {
            throw new Error(`Invalid notification type: ${notificationType}`);
        }

        const config = NOTIFICATION_CONFIGS[notificationType as TBillingNodeNotificationType];
        const fromDate = config.from();
        const toDate = config.to();

        const result = await this.qb.kysely
            .selectFrom('infraBillingNodes as ibn')
            .innerJoin('nodes as n', 'n.uuid', 'ibn.nodeUuid')
            .innerJoin('infraProviders as ip', 'ip.uuid', 'ibn.providerUuid')
            .select([
                'n.name as nodeName',
                'ip.loginUrl',
                'ip.name as providerName',
                'ibn.nextBillingAt',
            ])
            .where('ibn.nextBillingAt', '>=', fromDate)
            .where('ibn.nextBillingAt', '<', toDate)
            .orderBy('ibn.nextBillingAt', 'asc')
            .execute();

        return result.map((node) => new InfraBillingNodeNotificationEntity(node));
    }

    public async getAllActiveNotifications(): Promise<InfraBillingNodeNotificationEntity[]> {
        const results = await Promise.all(
            Object.keys(NOTIFICATION_CONFIGS).map(async (type) => {
                const notifications = await this.getNotificationsByType(type);
                return notifications.map((notification) => ({
                    ...notification,
                    notificationType: type as TBillingNodeNotificationType,
                }));
            }),
        );

        return results.flat().map((node) => new InfraBillingNodeNotificationEntity(node));
    }
}
