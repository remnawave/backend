import { Prisma } from '@prisma/client';
import { sql } from 'kysely';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { getKyselyUuid } from '@common/helpers/kysely/get-kysely-uuid';
import { TxKyselyService } from '@common/database';
import { ICrud } from '@common/types/crud-port';

import { IGetEnabledNodesPartialResponse } from '../queries/get-enabled-nodes-partial/get-enabled-nodes-partial.query';
import { IGetOnlineNodesPartialResponse } from '../queries/get-online-nodes';
import { NodesEntity } from '../entities/nodes.entity';
import { NodesConverter } from '../nodes.converter';
import { IReorderNode } from '../interfaces';

export type INodesWithResolvedInbounds = Prisma.NodesGetPayload<{
    include: {
        configProfileInboundsToNodes: {
            select: {
                configProfileInbounds: true;
            };
        };
        provider: true;
    };
}>;

export interface ExpectedUserRow {
    tId: number;
    vlessUuid: string;
    username: string;
    inboundTags: string[];
}

export interface ExpectedInboundForReconcile {
    tag: string;
    type: string;
    network: string | null;
    security: string | null;
    rawInbound: unknown;
}

export interface ExpectedUserForReconcile {
    tId: number;
    vlessUuid: string;
    username: string;
    trojanPassword: string;
    ssPassword: string;
    inbounds: ExpectedInboundForReconcile[];
}

const INCLUDE_RESOLVED_INBOUNDS = {
    configProfileInboundsToNodes: {
        select: {
            configProfileInbounds: true,
        },
    },
    provider: true,
} as const;

@Injectable()
export class NodesRepository implements ICrud<NodesEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
        private readonly nodesConverter: NodesConverter,
    ) {}

    public async create(entity: NodesEntity): Promise<NodesEntity> {
        const model = this.nodesConverter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.nodes.create({
            data: model,
            include: INCLUDE_RESOLVED_INBOUNDS,
        });

        return new NodesEntity(result);
    }

    public async findConnectedNodes(): Promise<NodesEntity[]> {
        const nodesList = await this.prisma.tx.nodes.findMany({
            where: {
                isConnected: true,
                isDisabled: false,
                isConnecting: false,
                activeConfigProfileUuid: {
                    not: null,
                },
            },
            include: INCLUDE_RESOLVED_INBOUNDS,
        });

        return nodesList.map((value) => new NodesEntity(value));
    }

    public async findConnectedNodesPartial(): Promise<IGetOnlineNodesPartialResponse[]> {
        const nodesList = await this.qb.kysely
            .selectFrom('nodes')
            .select(['uuid', 'address', 'port', 'consumptionMultiplier', 'id'])
            .where('isConnected', '=', true)
            .where('isDisabled', '=', false)
            .where('isConnecting', '=', false)
            .where('activeConfigProfileUuid', 'is not', null)
            .execute();

        return nodesList;
    }

    public async findEnabledNodesPartial(): Promise<IGetEnabledNodesPartialResponse[]> {
        const nodesList = await this.qb.kysely
            .selectFrom('nodes')
            .select(['uuid', 'address', 'port', 'isConnected'])
            .where('isDisabled', '=', false)
            .where('isConnecting', '=', false)
            .execute();

        return nodesList;
    }

    public async findConnectedNodesWithoutInbounds(): Promise<
        {
            uuid: string;
            address: string;
            port: number | null;
        }[]
    > {
        return await this.prisma.tx.nodes.findMany({
            select: {
                uuid: true,
                address: true,
                port: true,
            },
            where: {
                isConnected: true,
                isDisabled: false,
                activeConfigProfileUuid: {
                    not: null,
                },
            },
        });
    }

    public async findAllNodes(): Promise<NodesEntity[]> {
        const nodesList = await this.prisma.tx.nodes.findMany({
            include: INCLUDE_RESOLVED_INBOUNDS,
        });

        return nodesList.map((value) => new NodesEntity(value));
    }

    public async incrementUsedTraffic(nodeUuid: string, bytes: bigint): Promise<void> {
        await this.prisma.tx.nodes.update({
            where: { uuid: nodeUuid },
            data: { trafficUsedBytes: { increment: bytes } },
        });
    }

    public async findByUUID(uuid: string): Promise<NodesEntity | null> {
        const result = await this.prisma.tx.nodes.findUnique({
            where: { uuid },
            include: INCLUDE_RESOLVED_INBOUNDS,
        });
        if (!result) {
            return null;
        }
        return new NodesEntity(result);
    }

    public async update({ uuid, ...data }: Partial<NodesEntity>): Promise<NodesEntity> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { provider, activeInbounds, ...prismaData } = data;

        const result = await this.prisma.tx.nodes.update({
            where: { uuid },
            data: prismaData,
            include: INCLUDE_RESOLVED_INBOUNDS,
        });

        return new NodesEntity(result);
    }

    public async findByCriteria(dto: Partial<NodesEntity>): Promise<NodesEntity[]> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tags, ...rest } = dto;
        const nodesList = await this.prisma.tx.nodes.findMany({
            where: rest,
            orderBy: {
                viewPosition: 'asc',
            },
            include: INCLUDE_RESOLVED_INBOUNDS,
        });
        return nodesList.map((value) => new NodesEntity(value));
    }

    public async findByCriteriaPrisma(where: Prisma.NodesWhereInput): Promise<NodesEntity[]> {
        const nodesList = await this.prisma.tx.nodes.findMany({
            where,
            orderBy: {
                viewPosition: 'asc',
            },
            include: INCLUDE_RESOLVED_INBOUNDS,
        });
        return nodesList.map((value) => new NodesEntity(value));
    }

    public async findFirstByCriteria(dto: Partial<NodesEntity>): Promise<NodesEntity | null> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tags, ...rest } = dto;
        const result = await this.prisma.tx.nodes.findFirst({
            where: rest,
            include: INCLUDE_RESOLVED_INBOUNDS,
        });

        if (!result) {
            return null;
        }

        return new NodesEntity(result);
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.nodes.delete({ where: { uuid } });
        return !!result;
    }

    public async reorderMany(dto: IReorderNode[]): Promise<boolean> {
        await this.prisma.withTransaction(async () => {
            for (const { uuid, viewPosition } of dto) {
                await this.prisma.tx.nodes.updateMany({
                    where: { uuid },
                    data: { viewPosition },
                });
            }
        });

        await this.prisma.tx
            .$executeRaw`SELECT setval('nodes_view_position_seq', (SELECT MAX(view_position) FROM nodes) + 1)`;

        return true;
    }

    public async countOnlineUsers(): Promise<number> {
        const result = await this.prisma.tx.nodes.aggregate({
            where: {
                isConnected: true,
            },
            _sum: {
                usersOnline: true,
            },
        });

        return result._sum.usersOnline || 0;
    }

    public async removeInboundsFromNode(nodeUuid: string): Promise<boolean> {
        const result = await this.qb.kysely
            .deleteFrom('configProfileInboundsToNodes')
            .where('nodeUuid', '=', getKyselyUuid(nodeUuid))
            .executeTakeFirst();

        return !!result;
    }

    public async addInboundsToNode(nodeUuid: string, inboundsUuids: string[]): Promise<boolean> {
        const result = await this.qb.kysely
            .insertInto('configProfileInboundsToNodes')
            .values(
                inboundsUuids.map((uuid) => ({
                    nodeUuid: getKyselyUuid(nodeUuid),
                    configProfileInboundUuid: getKyselyUuid(uuid),
                })),
            )
            .executeTakeFirst();

        return !!result;
    }

    public async removeInboundsFromNodes(nodeUuids: string[]): Promise<boolean> {
        const result = await this.qb.kysely
            .deleteFrom('configProfileInboundsToNodes')
            .where(
                'nodeUuid',
                'in',
                nodeUuids.map((uuid) => getKyselyUuid(uuid)),
            )
            .executeTakeFirst();

        return !!result;
    }

    public async addInboundsToNodes(
        nodeUuids: string[],
        inboundsUuids: string[],
    ): Promise<boolean> {
        const values = nodeUuids.flatMap((nodeUuid) =>
            inboundsUuids.map((uuid) => ({
                nodeUuid: getKyselyUuid(nodeUuid),
                configProfileInboundUuid: getKyselyUuid(uuid),
            })),
        );

        const result = await this.qb.kysely
            .insertInto('configProfileInboundsToNodes')
            .values(values)
            .executeTakeFirst();

        return !!result;
    }

    public async clearActiveConfigProfileForNodesWithoutInbounds(): Promise<number> {
        const result = await this.qb.kysely
            .updateTable('nodes')
            .set({
                activeConfigProfileUuid: null,
            })
            .where('activeConfigProfileUuid', 'is not', null)
            .where((eb) =>
                eb.not(
                    eb.exists(
                        eb
                            .selectFrom('configProfileInboundsToNodes')
                            .select('nodeUuid')
                            .whereRef('nodeUuid', '=', 'nodes.uuid'),
                    ),
                ),
            )
            .executeTakeFirst();

        return Number(result.numUpdatedRows || 0);
    }

    public async findAllTags(): Promise<string[]> {
        const result = await this.qb.kysely
            .selectFrom('nodes')
            .select(sql<string>`unnest(tags)`.as('tag'))
            .distinct()
            .where('tags', 'is not', null)
            .orderBy('tag')
            .execute();

        return result.map((value) => value.tag);
    }

    public async getExpectedUsersForNode(nodeUuid: string): Promise<ExpectedUserRow[]> {
        const rows = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('internalSquadMembers', 'internalSquadMembers.userId', 'users.tId')
            .innerJoin(
                'internalSquadInbounds',
                'internalSquadInbounds.internalSquadUuid',
                'internalSquadMembers.internalSquadUuid',
            )
            .innerJoin(
                'configProfileInboundsToNodes',
                'configProfileInboundsToNodes.configProfileInboundUuid',
                'internalSquadInbounds.inboundUuid',
            )
            .innerJoin(
                'configProfileInbounds',
                'configProfileInbounds.uuid',
                'configProfileInboundsToNodes.configProfileInboundUuid',
            )
            .where('configProfileInboundsToNodes.nodeUuid', '=', getKyselyUuid(nodeUuid))
            .where('users.status', '=', 'ACTIVE')
            .select([
                'users.tId as tId',
                sql<string>`users.vless_uuid::text`.as('vlessUuid'),
                'users.username as username',
                // sql.ref() goes through CamelCasePlugin so configProfileInbounds.tag
                // is rewritten to the on-disk "config_profile_inbounds"."tag". A
                // hand-written quoted identifier would bypass the plugin and the
                // emitted SQL would reference a table Postgres doesn't have.
                sql<string[]>`array_agg(distinct ${sql.ref('configProfileInbounds.tag')})`.as(
                    'inboundTags',
                ),
            ])
            .groupBy(['users.tId', 'users.vlessUuid', 'users.username'])
            .orderBy('users.tId')
            .execute();

        return rows.map((r) => ({
            tId: Number(r.tId),
            vlessUuid: r.vlessUuid,
            username: r.username,
            inboundTags: r.inboundTags,
        }));
    }

    /**
     * Returns ACTIVE users whose squad inbounds overlap this node, with the
     * full credential set + per-inbound metadata required to push them into
     * xray. Used by reconcileUsers — the diff endpoint that compono-relay-sync
     * calls every cycle to converge node state with the panel DB. Companion
     * to getExpectedUsersForNode (the read-only observer view).
     */
    public async getExpectedUsersForReconcile(
        nodeUuid: string,
    ): Promise<ExpectedUserForReconcile[]> {
        const rows = await this.qb.kysely
            .selectFrom('users')
            .innerJoin('internalSquadMembers', 'internalSquadMembers.userId', 'users.tId')
            .innerJoin(
                'internalSquadInbounds',
                'internalSquadInbounds.internalSquadUuid',
                'internalSquadMembers.internalSquadUuid',
            )
            .innerJoin(
                'configProfileInboundsToNodes',
                'configProfileInboundsToNodes.configProfileInboundUuid',
                'internalSquadInbounds.inboundUuid',
            )
            .innerJoin(
                'configProfileInbounds',
                'configProfileInbounds.uuid',
                'configProfileInboundsToNodes.configProfileInboundUuid',
            )
            .where('configProfileInboundsToNodes.nodeUuid', '=', getKyselyUuid(nodeUuid))
            .where('users.status', '=', 'ACTIVE')
            .select([
                'users.tId as tId',
                sql<string>`users.vless_uuid::text`.as('vlessUuid'),
                'users.username as username',
                'users.trojanPassword as trojanPassword',
                'users.ssPassword as ssPassword',
                'configProfileInbounds.tag as tag',
                'configProfileInbounds.type as type',
                'configProfileInbounds.network as network',
                'configProfileInbounds.security as security',
                'configProfileInbounds.rawInbound as rawInbound',
            ])
            .execute();

        const byTid = new Map<string, ExpectedUserForReconcile>();
        for (const r of rows) {
            const key = String(r.tId);
            let user = byTid.get(key);
            if (!user) {
                user = {
                    tId: Number(r.tId),
                    vlessUuid: r.vlessUuid,
                    username: r.username,
                    trojanPassword: r.trojanPassword,
                    ssPassword: r.ssPassword,
                    inbounds: [],
                };
                byTid.set(key, user);
            }
            // Same (tag,type) can appear once per matching squad; dedupe on tag.
            if (!user.inbounds.some((ib) => ib.tag === r.tag)) {
                user.inbounds.push({
                    tag: r.tag,
                    type: r.type,
                    network: r.network,
                    security: r.security,
                    rawInbound: r.rawInbound,
                });
            }
        }
        return [...byTid.values()].sort((a, b) => a.tId - b.tId);
    }

    /**
     * Look up vless_uuid for a set of t_ids regardless of status. Used by
     * reconcileUsers when removing stale users from xray — RemoveUserCommand
     * requires hashData.vlessUuid for cache-key invalidation on the node.
     */
    public async findVlessUuidsByTIds(tIds: number[]): Promise<Map<string, string>> {
        const out = new Map<string, string>();
        if (tIds.length === 0) {
            return out;
        }
        const rows = await this.qb.kysely
            .selectFrom('users')
            .where(
                'users.tId',
                'in',
                tIds.map((n) => BigInt(n)),
            )
            .select(['users.tId as tId', sql<string>`users.vless_uuid::text`.as('vlessUuid')])
            .execute();
        for (const r of rows) {
            out.set(String(r.tId), r.vlessUuid);
        }
        return out;
    }
}
