import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';
import { sql } from 'kysely';
import { IReorderHost } from 'src/modules/hosts/interfaces/reorder-host.interface';

import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { getKyselyUuid } from '@common/helpers';
import { values } from '@common/helpers/kysely/values';
import { ICrud } from '@common/types/crud-port';
import { INTERNAL_SQUADS_MODE } from '@libs/contracts/constants';

import { HostsEntity } from '../entities/hosts.entity';
import { HostsConverter } from '../hosts.converter';

const INCLUDE_RELATED = {
    nodes: {
        select: {
            nodeUuid: true,
        },
    },
    internalSquads: {
        select: {
            squadUuid: true,
        },
    },
} as const;

@Injectable()
export class HostsRepository implements ICrud<HostsEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly hostsConverter: HostsConverter,
    ) {}

    public async create(entity: HostsEntity): Promise<HostsEntity> {
        const model = this.hostsConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.hosts.create({
            data: {
                ...model,
                xhttpExtraParams: model.xhttpExtraParams as Prisma.InputJsonValue,
                muxParams: model.muxParams as Prisma.InputJsonValue,
                sockoptParams: model.sockoptParams as Prisma.InputJsonValue,
                finalMask: model.finalMask as Prisma.InputJsonValue,
            },
            include: INCLUDE_RELATED,
        });

        return this.hostsConverter.fromPrismaModelToEntity(result);
    }

    public async findByUUID(uuid: string): Promise<HostsEntity | null> {
        const result = await this.prisma.tx.hosts.findUnique({
            where: { uuid },
            include: INCLUDE_RELATED,
        });
        if (!result) {
            return null;
        }
        return this.hostsConverter.fromPrismaModelToEntity(result);
    }

    public async update({
        uuid,
        ...data
    }: Partial<Omit<HostsEntity, 'internalSquads' | 'nodes'>>): Promise<HostsEntity> {
        const result = await this.prisma.tx.hosts.update({
            where: {
                uuid,
            },
            data: {
                ...data,
                xhttpExtraParams: data.xhttpExtraParams as Prisma.InputJsonValue,
                muxParams: data.muxParams as Prisma.InputJsonValue,
                sockoptParams: data.sockoptParams as Prisma.InputJsonValue,
                finalMask: data.finalMask as Prisma.InputJsonValue,
            },
            include: INCLUDE_RELATED,
        });

        return this.hostsConverter.fromPrismaModelToEntity(result);
    }

    public async updateMany({
        uuids,
        data,
    }: {
        uuids: string[];
        data: Partial<Omit<HostsEntity, 'internalSquads' | 'nodes'>>;
    }): Promise<number> {
        const result = await this.prisma.tx.hosts.updateMany({
            where: {
                uuid: {
                    in: uuids,
                },
            },
            data: {
                ...data,
                xhttpExtraParams: data.xhttpExtraParams as Prisma.InputJsonValue,
                muxParams: data.muxParams as Prisma.InputJsonValue,
                sockoptParams: data.sockoptParams as Prisma.InputJsonValue,
                finalMask: data.finalMask as Prisma.InputJsonValue,
            },
        });

        return result.count;
    }

    public async findByCriteria(
        dto: Omit<
            Partial<HostsEntity>,
            | 'xhttpExtraParams'
            | 'muxParams'
            | 'sockoptParams'
            | 'nodes'
            | 'internalSquads'
            | 'excludeFromSubscriptionTypes'
            | 'finalMask'
            | 'tags'
            | 'mapper'
        >,
    ): Promise<HostsEntity[]> {
        const list = await this.prisma.tx.hosts.findMany({
            where: dto,
            include: INCLUDE_RELATED,
        });
        return this.hostsConverter.fromPrismaModelsToEntities(list);
    }

    public async findAll(): Promise<HostsEntity[]> {
        const list = await this.prisma.tx.hosts.findMany({
            orderBy: {
                viewPosition: 'asc',
            },
            include: INCLUDE_RELATED,
        });
        return this.hostsConverter.fromPrismaModelsToEntities(list);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.hosts.delete({ where: { uuid } });
        return !!result;
    }

    public async deleteMany(uuids: string[]): Promise<boolean> {
        const result = await this.prisma.tx.hosts.deleteMany({ where: { uuid: { in: uuids } } });
        return !!result;
    }

    public async enableMany(uuids: string[]): Promise<boolean> {
        const result = await this.prisma.tx.hosts.updateMany({
            where: { uuid: { in: uuids } },
            data: { isDisabled: false },
        });
        return !!result;
    }

    public async disableMany(uuids: string[]): Promise<boolean> {
        const result = await this.prisma.tx.hosts.updateMany({
            where: { uuid: { in: uuids } },
            data: { isDisabled: true },
        });
        return !!result;
    }

    public async findActiveHostsByUserId(
        userId: bigint,
        returnDisabledHosts: boolean = false,
        returnHiddenHosts: boolean = false,
    ) {
        return await this.qb.kysely
            .selectFrom('hosts')
            .selectAll('hosts')
            .where((eb) =>
                eb.exists(
                    eb
                        .selectFrom('internalSquadInbounds')
                        .innerJoin(
                            'internalSquadMembers',
                            'internalSquadMembers.internalSquadUuid',
                            'internalSquadInbounds.internalSquadUuid',
                        )
                        .whereRef(
                            'internalSquadInbounds.inboundUuid',
                            '=',
                            'hosts.configProfileInboundUuid',
                        )
                        .where('internalSquadMembers.userId', '=', userId)
                        .where((eb2) =>
                            eb2(
                                eb2.exists(
                                    eb2
                                        .selectFrom('internalSquadHostLinks')
                                        .whereRef(
                                            'internalSquadHostLinks.hostUuid',
                                            '=',
                                            'hosts.uuid',
                                        )
                                        .whereRef(
                                            'internalSquadHostLinks.squadUuid',
                                            '=',
                                            'internalSquadInbounds.internalSquadUuid',
                                        )
                                        .select(eb2.val(1).as('one')),
                                ),
                                '=',
                                eb2.parens(
                                    'hosts.internalSquadsMode',
                                    '=',
                                    INTERNAL_SQUADS_MODE.ALLOW_ONLY,
                                ),
                            ),
                        )
                        .select(eb.val(1).as('one')),
                ),
            )
            .$if(!returnDisabledHosts, (eb) => eb.where('hosts.isDisabled', '=', false))
            .$if(!returnHiddenHosts, (eb) => eb.where('hosts.isHidden', '=', false))
            .orderBy('hosts.viewPosition', 'asc')
            .execute();
    }

    public async getInboundsByUuids(uuids: string[]) {
        if (uuids.length === 0) {
            return [];
        }

        return await this.qb.kysely
            .selectFrom('configProfileInbounds')
            .select(['uuid', 'rawInbound', 'tag'])
            .where(
                'uuid',
                'in',
                uuids.map((u) => getKyselyUuid(u)),
            )
            .execute();
    }

    public async getTemplatesByUuids(uuids: string[]) {
        if (uuids.length === 0) {
            return [];
        }

        return await this.qb.kysely
            .selectFrom('subscriptionTemplates')
            .select(['uuid', 'templateJson'])
            .where(
                'uuid',
                'in',
                uuids.map((u) => getKyselyUuid(u)),
            )
            .execute();
    }

    public async reorderMany(dto: IReorderHost[]): Promise<boolean> {
        if (dto.length === 0) return true;

        const v = values(
            dto.map(({ uuid, viewPosition }) => ({
                uuid: sql<string>`${uuid}::uuid`,
                viewPosition: sql<number>`${viewPosition}::int`,
            })),
            'v',
        );

        await this.qb.kysely
            .updateTable('hosts as h')
            .from(v)
            .set((eb) => ({ viewPosition: eb.ref('v.viewPosition') }))
            .whereRef('h.uuid', '=', 'v.uuid')
            .execute();

        await this.prisma.tx
            .$executeRaw`SELECT setval('hosts_view_position_seq', (SELECT MAX(view_position) FROM hosts) + 1)`;

        return true;
    }

    public async findAllTags(): Promise<string[]> {
        const result = await this.qb.kysely
            .selectFrom('hosts')
            .select(sql<string>`unnest(tags)`.as('tag'))
            .distinct()
            .where('tags', 'is not', null)
            .orderBy('tag')
            .execute();

        return result.map((value) => value.tag);
    }

    public async addNodesToHost(hostUuid: string, nodes: string[]): Promise<boolean> {
        if (nodes.length === 0) {
            return true;
        }

        const result = await this.prisma.tx.hostsToNodes.createMany({
            data: nodes.map((node) => ({ hostUuid, nodeUuid: node })),
            skipDuplicates: true,
        });
        return !!result;
    }

    public async addNodesToHosts(hostUuids: string[], nodes: string[]): Promise<boolean> {
        if (hostUuids.length === 0 || nodes.length === 0) {
            return true;
        }
        const result = await this.prisma.tx.hostsToNodes.createMany({
            data: hostUuids.flatMap((hostUuid) =>
                nodes.map((node) => ({ hostUuid, nodeUuid: node })),
            ),
            skipDuplicates: true,
        });
        return !!result.count;
    }

    public async clearNodesFromHost(hostUuid: string): Promise<boolean> {
        const result = await this.prisma.tx.hostsToNodes.deleteMany({
            where: { hostUuid },
        });
        return !!result;
    }

    public async clearNodesFromHosts(hostUuids: string[]): Promise<boolean> {
        const result = await this.prisma.tx.hostsToNodes.deleteMany({
            where: { hostUuid: { in: hostUuids } },
        });
        return !!result;
    }

    public async addInternalSquadsToHost(hostUuid: string, squadUuids: string[]): Promise<boolean> {
        if (squadUuids.length === 0) {
            return true;
        }

        const result = await this.prisma.tx.internalSquadHostLinks.createMany({
            data: squadUuids.map((squad) => ({ hostUuid, squadUuid: squad })),
            skipDuplicates: true,
        });
        return !!result;
    }

    public async addInternalSquadsToHosts(
        hostUuids: string[],
        squadUuids: string[],
    ): Promise<boolean> {
        if (hostUuids.length === 0 || squadUuids.length === 0) {
            return true;
        }

        const result = await this.prisma.tx.internalSquadHostLinks.createMany({
            data: hostUuids.flatMap((hostUuid) =>
                squadUuids.map((squad) => ({ hostUuid, squadUuid: squad })),
            ),
            skipDuplicates: true,
        });
        return !!result;
    }

    public async clearInternalSquadsFromHost(hostUuid: string): Promise<boolean> {
        const result = await this.prisma.tx.internalSquadHostLinks.deleteMany({
            where: { hostUuid },
        });
        return !!result;
    }

    public async clearInternalSquadsFromHosts(hostUuids: string[]): Promise<boolean> {
        const result = await this.prisma.tx.internalSquadHostLinks.deleteMany({
            where: { hostUuid: { in: hostUuids } },
        });
        return !!result;
    }
}
