import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { ExpressionBuilder } from 'kysely';

import { PrismaClient, Prisma } from '@generated/prisma/client';
import { DB } from 'prisma/generated/types';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { getKyselyUuid } from '@common/helpers';

import { ConfigProfileWithInboundsAndNodesEntity } from '../entities/config-profile-with-inbounds-and-nodes.entity';
import { ConfigProfileInboundEntity } from '../entities/config-profile-inbound.entity';
import { ConfigProfileConverter } from '../converters/config-profile.converter';
import { ConfigProfileEntity } from '../entities/config-profile.entity';
import { ConfigProfileInboundWithSquadsEntity } from '../entities';

@Injectable()
export class ConfigProfileRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
        private readonly qb: TxKyselyService,
        private readonly configProfileConverter: ConfigProfileConverter,
    ) {}

    public async create(
        entity: ConfigProfileEntity,
        inbounds: ConfigProfileInboundEntity[],
    ): Promise<{ uuid: string }> {
        const model = this.configProfileConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.configProfiles.create({
            select: {
                uuid: true,
            },
            data: {
                ...model,
                config: model.config as Prisma.InputJsonValue,
                configProfileInbounds: {
                    create: inbounds.map((inbound) => ({
                        ...inbound,
                    })),
                },
            },
        });

        return {
            uuid: result.uuid,
        };
    }

    public async findByUUID(uuid: string): Promise<ConfigProfileEntity | null> {
        const result = await this.prisma.tx.configProfiles.findUnique({
            where: { uuid },
        });
        if (!result) {
            return null;
        }
        return this.configProfileConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<ConfigProfileEntity>): Promise<ConfigProfileEntity> {
        const result = await this.prisma.tx.configProfiles.update({
            where: {
                uuid,
            },
            data: {
                ...data,
                config: data.config as Prisma.InputJsonValue,
            },
        });

        return this.configProfileConverter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(dto: Partial<ConfigProfileEntity>): Promise<ConfigProfileEntity[]> {
        const configProfileList = await this.prisma.tx.configProfiles.findMany({
            where: dto,
        });
        return this.configProfileConverter.fromPrismaModelsToEntities(configProfileList);
    }

    public async findFirstByCriteria(
        dto: Partial<ConfigProfileEntity>,
    ): Promise<ConfigProfileEntity | null> {
        const result = await this.prisma.tx.configProfiles.findFirst({
            where: dto,
        });

        if (!result) {
            return null;
        }

        return this.configProfileConverter.fromPrismaModelToEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.configProfiles.delete({ where: { uuid } });
        return !!result;
    }

    public async getTotalConfigProfiles(): Promise<number> {
        return await this.prisma.tx.configProfiles.count();
    }

    public async getAllConfigProfiles(): Promise<ConfigProfileWithInboundsAndNodesEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfiles')
            .selectAll('configProfiles')
            .orderBy('configProfiles.viewPosition', 'asc')
            .select((eb) => [
                // inbounds
                this.includeInbounds(eb),
                // nodes
                this.includeNodes(eb),
            ])
            .execute();

        return result.map((item) => new ConfigProfileWithInboundsAndNodesEntity(item));
    }

    public async getConfigProfileByUUID(
        uuid: string,
    ): Promise<ConfigProfileWithInboundsAndNodesEntity | null> {
        const result = await this.qb.kysely
            .selectFrom('configProfiles')
            .selectAll('configProfiles')
            .where('configProfiles.uuid', '=', getKyselyUuid(uuid))
            .select((eb) => [
                // inbounds
                this.includeInbounds(eb),
                // nodes
                this.includeNodes(eb),
            ])
            .executeTakeFirst();

        if (!result) {
            return null;
        }

        return new ConfigProfileWithInboundsAndNodesEntity(result);
    }

    public async createManyConfigProfileInbounds(inbounds: ConfigProfileInboundEntity[]): Promise<{
        count: number;
    }> {
        const result = await this.prisma.tx.configProfileInbounds.createMany({
            data: inbounds.map((inbound) => ({
                ...inbound,
                rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
            })),
        });

        return {
            count: result.count,
        };
    }

    public async deleteManyConfigProfileInboundsByUUIDs(uuids: string[]): Promise<{
        count: number;
    }> {
        const result = await this.prisma.tx.configProfileInbounds.deleteMany({
            where: { uuid: { in: uuids } },
        });

        return {
            count: result.count,
        };
    }

    public async updateConfigProfileInbound(
        inbound: ConfigProfileInboundEntity,
    ): Promise<ConfigProfileInboundEntity> {
        const result = await this.prisma.tx.configProfileInbounds.update({
            where: { uuid: inbound.uuid },
            data: {
                ...inbound,
                rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
            },
        });

        return new ConfigProfileInboundEntity(result);
    }

    public async getInboundsByProfileUuid(
        profileUuid: string,
    ): Promise<ConfigProfileInboundEntity[]> {
        const result = await this.prisma.tx.configProfileInbounds.findMany({
            where: { profileUuid },
        });

        return result.map((item) => new ConfigProfileInboundEntity(item));
    }

    public async getInboundsWithSquadsByProfileUuid(
        profileUuid: string,
    ): Promise<ConfigProfileInboundWithSquadsEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfileInbounds')
            .where('configProfileInbounds.profileUuid', '=', getKyselyUuid(profileUuid))
            .selectAll('configProfileInbounds')
            .select((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('internalSquadInbounds')
                        .select(['internalSquadInbounds.internalSquadUuid as uuid'])
                        .whereRef(
                            'internalSquadInbounds.inboundUuid',
                            '=',
                            'configProfileInbounds.uuid',
                        ),
                ).as('activeSquads'),
            ])
            .execute();

        return result.map((item) => new ConfigProfileInboundWithSquadsEntity(item));
    }

    public async getAllInbounds(): Promise<ConfigProfileInboundWithSquadsEntity[]> {
        const result = await this.qb.kysely
            .selectFrom('configProfileInbounds')
            .selectAll('configProfileInbounds')
            .select((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('internalSquadInbounds')
                        .select(['internalSquadInbounds.internalSquadUuid as uuid'])
                        .whereRef(
                            'internalSquadInbounds.inboundUuid',
                            '=',
                            'configProfileInbounds.uuid',
                        ),
                ).as('activeSquads'),
            ])
            .execute();

        return result.map((item) => new ConfigProfileInboundWithSquadsEntity(item));
    }

    public async reorderMany(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.configProfiles.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('config_profiles_view_position_seq', (SELECT MAX(view_position) FROM config_profiles) + 1)`;

        return true;
    }

    /* 

    Kysely helpers

    */

    private includeInbounds(eb: ExpressionBuilder<DB, 'configProfiles'>) {
        return jsonArrayFrom(
            eb
                .selectFrom('configProfileInbounds')
                .selectAll('configProfileInbounds')
                .whereRef('configProfileInbounds.profileUuid', '=', 'configProfiles.uuid'),
        ).as('inbounds');
    }

    private includeNodes(eb: ExpressionBuilder<DB, 'configProfiles'>) {
        return jsonArrayFrom(
            eb
                .selectFrom('nodes')
                .select(['uuid', 'name', 'countryCode'])
                .orderBy('nodes.viewPosition', 'asc')
                .whereRef('nodes.activeConfigProfileUuid', '=', 'configProfiles.uuid'),
        ).as('nodes');
    }
}
