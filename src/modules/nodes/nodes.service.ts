import { Prisma } from '@prisma/client';

import { ERRORS, EVENTS, NODES_BULK_ACTIONS } from '@contract/constants';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AddUserCommand as AddUserToNodeCommandSdk, CipherType } from '@remnawave/node-contract';

import { getVlessFlowFromDbInbound } from '@common/utils/flow/get-vless-flow';
import { mapDefined, wrapBigInt } from '@common/utils';
import { fail, ok, TResult } from '@common/types';
import { AxiosService } from '@common/axios';
import { toNano } from '@common/utils/nano';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { CreateNodeTrafficUsageHistoryCommand } from '@modules/nodes-traffic-usage-history/commands/create-node-traffic-usage-history';
import { NodesTrafficUsageHistoryEntity } from '@modules/nodes-traffic-usage-history/entities/nodes-traffic-usage-history.entity';
import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities/config-profile-inbound.entity';
import { GetConfigProfileByUuidQuery } from '@modules/config-profiles/queries/get-config-profile-by-uuid';

import { NodesQueuesService } from '@queue/_nodes';

import {
    BaseEventResponseModel,
    DeleteNodeResponseModel,
    ReconcileUserChange,
    ReconcileUserError,
    ReconcileUsersResponseModel,
    RestartNodeResponseModel,
} from './models';
import {
    BulkNodesActionsRequestDto,
    CreateNodeRequestDto,
    ProfileModificationRequestDto,
    ReorderNodeRequestDto,
    UpdateNodeRequestDto,
} from './dtos';
import {
    reconcileAddedTotal,
    reconcileErrorsTotal,
    reconcileRemovedTotal,
    reconcileRunsTotal,
} from './utils/reconcile-metrics';
import {
    ExpectedUserForReconcile,
    ExpectedUserRow,
    NodesRepository,
} from './repositories/nodes.repository';
import {
    computeReconcileDiff,
    evaluateSafetyCap,
    ReconcileExpectedUser,
} from './utils/reconcile-diff';
import { NodesEntity } from './entities';

@Injectable()
export class NodesService {
    private readonly logger = new Logger(NodesService.name);

    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly axiosService: AxiosService,
    ) {}

    public async createNode(body: CreateNodeRequestDto): Promise<TResult<NodesEntity>> {
        try {
            const { configProfile, ...nodeData } = body;

            const nodeEntity = new NodesEntity({
                ...nodeData,
                address: nodeData.address.trim(),
                isConnected: false,
                isConnecting: false,
                isDisabled: false,
                trafficLimitBytes: wrapBigInt(nodeData.trafficLimitBytes),
                consumptionMultiplier: mapDefined(nodeData.consumptionMultiplier, toNano),
                activeConfigProfileUuid: configProfile.activeConfigProfileUuid,
            });

            const result = await this.nodesRepository.create(nodeEntity);

            if (configProfile) {
                const configProfileResponse = await this.queryBus.execute(
                    new GetConfigProfileByUuidQuery(configProfile.activeConfigProfileUuid),
                );

                if (configProfileResponse.isOk) {
                    const inbounds = configProfileResponse.response.inbounds;

                    const areAllInboundsFromConfigProfile = configProfile.activeInbounds.every(
                        (activeInboundUuid) =>
                            inbounds.some((inbound) => inbound.uuid === activeInboundUuid),
                    );

                    if (areAllInboundsFromConfigProfile) {
                        await this.nodesRepository.addInboundsToNode(
                            result.uuid,
                            configProfile.activeInbounds,
                        );
                    } else {
                        return fail(ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE);
                    }
                }
            }

            const node = await this.nodesRepository.findByUUID(result.uuid);

            if (!node) {
                throw new Error('Node not found');
            }

            await this.nodesQueuesService.startNode({
                nodeUuid: node.uuid,
            });

            this.eventEmitter.emit(EVENTS.NODE.CREATED, new NodeEvent(node, EVENTS.NODE.CREATED));

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'Nodes' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.NODE_NAME_ALREADY_EXISTS);
                }
                if (fields.includes('address')) {
                    return fail(ERRORS.NODE_ADDRESS_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.CREATE_NODE_ERROR);
        }
    }

    public async getAllNodes(): Promise<TResult<NodesEntity[]>> {
        try {
            return ok(await this.nodesRepository.findByCriteria({}));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_NODES_ERROR);
        }
    }

    public async restartNode(uuid: string): Promise<TResult<RestartNodeResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            if (node.isDisabled) {
                return fail(ERRORS.NODE_IS_DISABLED);
            }

            await this.nodesQueuesService.startNode({
                nodeUuid: node.uuid,
            });

            return ok(new RestartNodeResponseModel(true));
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return fail(ERRORS.RESTART_NODE_ERROR);
        }
    }

    public async resetNodeTraffic(uuid: string): Promise<TResult<BaseEventResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            await this.commandBus.execute(
                new CreateNodeTrafficUsageHistoryCommand(
                    new NodesTrafficUsageHistoryEntity({
                        nodeUuid: node.uuid,
                        trafficBytes: node.trafficUsedBytes || BigInt(0),
                        resetAt: new Date(),
                    }),
                ),
            );

            await this.nodesRepository.update({
                uuid: node.uuid,
                trafficUsedBytes: BigInt(0),
            });

            return ok(new BaseEventResponseModel(true));
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return fail(ERRORS.RESET_NODE_TRAFFIC_ERROR);
        }
    }

    public async restartAllNodes(
        forceRestart?: boolean,
    ): Promise<TResult<RestartNodeResponseModel>> {
        try {
            const nodes = await this.nodesRepository.findByCriteria({
                isDisabled: false,
            });
            if (nodes.length === 0) {
                return fail(ERRORS.ENABLED_NODES_NOT_FOUND);
            }

            await this.nodesQueuesService.startAllNodes({
                emitter: NodesService.name,
                force: forceRestart ?? false,
            });

            return ok(new RestartNodeResponseModel(true));
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return fail(ERRORS.RESTART_NODE_ERROR);
        }
    }

    public async getOneNode(uuid: string): Promise<TResult<NodesEntity>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            return ok(node);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ONE_NODE_ERROR);
        }
    }

    public async deleteNode(uuid: string): Promise<TResult<DeleteNodeResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            await this.nodesQueuesService.stopNode({
                nodeUuid: node.uuid,
                isNeedToBeDeleted: true,
            });

            this.eventEmitter.emit(EVENTS.NODE.DELETED, new NodeEvent(node, EVENTS.NODE.DELETED));

            return ok(new DeleteNodeResponseModel({ isDeleted: true }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_NODE_ERROR);
        }
    }

    public async updateNode(body: UpdateNodeRequestDto): Promise<TResult<NodesEntity>> {
        try {
            const { configProfile, ...nodeData } = body;

            const node = await this.nodesRepository.findByUUID(body.uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            if (configProfile) {
                const configProfileResponse = await this.queryBus.execute(
                    new GetConfigProfileByUuidQuery(configProfile.activeConfigProfileUuid),
                );

                if (configProfileResponse.isOk) {
                    const inbounds = configProfileResponse.response.inbounds;

                    const areAllInboundsFromConfigProfile = configProfile.activeInbounds.every(
                        (activeInboundUuid) =>
                            inbounds.some((inbound) => inbound.uuid === activeInboundUuid),
                    );

                    if (areAllInboundsFromConfigProfile) {
                        await this.nodesRepository.removeInboundsFromNode(node.uuid);

                        await this.nodesRepository.addInboundsToNode(
                            node.uuid,
                            configProfile.activeInbounds,
                        );
                    } else {
                        return fail(ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE);
                    }
                }
            }

            const result = await this.nodesRepository.update({
                ...nodeData,
                address: nodeData.address ? nodeData.address.trim() : undefined,
                trafficLimitBytes: wrapBigInt(nodeData.trafficLimitBytes),
                consumptionMultiplier: mapDefined(nodeData.consumptionMultiplier, toNano),
                activeConfigProfileUuid: configProfile?.activeConfigProfileUuid,
            });

            if (!result) {
                return fail(ERRORS.UPDATE_NODE_ERROR);
            }

            if (!node.isDisabled) {
                await this.nodesQueuesService.startNode({
                    nodeUuid: result.uuid,
                });
            }

            this.eventEmitter.emit(
                EVENTS.NODE.MODIFIED,
                new NodeEvent(result, EVENTS.NODE.MODIFIED),
            );

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ENABLE_NODE_ERROR);
        }
    }

    public async enableNode(uuid: string): Promise<TResult<NodesEntity>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            if (!node.activeConfigProfileUuid || node.activeInbounds.length === 0) {
                const result = await this.nodesRepository.update({
                    uuid: node.uuid,
                    isDisabled: true,
                    activeConfigProfileUuid: null,
                    isConnecting: false,
                    isConnected: false,
                    lastStatusMessage: null,
                    lastStatusChange: new Date(),
                    usersOnline: 0,
                });

                if (!result) {
                    return fail(ERRORS.ENABLE_NODE_ERROR);
                }

                return ok(result);
            }

            const result = await this.nodesRepository.update({
                uuid: node.uuid,
                isDisabled: false,
            });

            if (!result) {
                return fail(ERRORS.ENABLE_NODE_ERROR);
            }

            await this.nodesQueuesService.startNode({
                nodeUuid: result.uuid,
            });

            this.eventEmitter.emit(EVENTS.NODE.ENABLED, new NodeEvent(result, EVENTS.NODE.ENABLED));

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ENABLE_NODE_ERROR);
        }
    }

    public async disableNode(uuid: string): Promise<TResult<NodesEntity>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            if (!node.activeConfigProfileUuid || node.activeInbounds.length === 0) {
                await this.nodesRepository.update({
                    uuid: node.uuid,
                    activeConfigProfileUuid: null,
                });
            }

            const result = await this.nodesRepository.update({
                uuid: node.uuid,
                isDisabled: true,
                isConnecting: false,
                isConnected: false,
                lastStatusMessage: null,
                lastStatusChange: new Date(),
                usersOnline: 0,
            });

            if (!result) {
                return fail(ERRORS.DISABLE_NODE_ERROR);
            }

            await this.nodesQueuesService.stopNode({
                nodeUuid: result.uuid,
                isNeedToBeDeleted: false,
            });

            this.eventEmitter.emit(
                EVENTS.NODE.DISABLED,
                new NodeEvent(result, EVENTS.NODE.DISABLED),
            );

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ENABLE_NODE_ERROR);
        }
    }

    public async reorderNodes(dto: ReorderNodeRequestDto): Promise<TResult<NodesEntity[]>> {
        try {
            await this.nodesRepository.reorderMany(dto.nodes);

            return ok(await this.nodesRepository.findByCriteria({}));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REORDER_NODES_ERROR);
        }
    }

    public async getAllNodesTags(): Promise<TResult<string[]>> {
        try {
            return ok(await this.nodesRepository.findAllTags());
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async profileModification(
        body: ProfileModificationRequestDto,
    ): Promise<TResult<BaseEventResponseModel>> {
        try {
            const { uuids, configProfile } = body;

            const configProfileResponse = await this.queryBus.execute(
                new GetConfigProfileByUuidQuery(configProfile.activeConfigProfileUuid),
            );

            if (!configProfileResponse.isOk) {
                return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);
            }

            const inbounds = configProfileResponse.response.inbounds;

            const allActiveInboundsExistInProfile = configProfile.activeInbounds.every(
                (activeInboundUuid) =>
                    inbounds.some((inbound) => inbound.uuid === activeInboundUuid),
            );

            if (!allActiveInboundsExistInProfile) {
                return fail(ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE);
            }

            await this.nodesRepository.removeInboundsFromNodes(uuids);

            await this.nodesRepository.addInboundsToNodes(uuids, configProfile.activeInbounds);

            await this.nodesQueuesService.startAllNodesByProfile({
                profileUuid: configProfile.activeConfigProfileUuid,
                emitter: 'bulkProfileModification',
            }); // no need to restart all nodes

            return ok(new BaseEventResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async bulkNodesActions(
        body: BulkNodesActionsRequestDto,
    ): Promise<TResult<BaseEventResponseModel>> {
        try {
            const { uuids, action } = body;

            const actionMap: Record<string, (uuid: string) => Promise<unknown>> = {
                [NODES_BULK_ACTIONS.ENABLE]: (uuid) => this.enableNode(uuid),
                [NODES_BULK_ACTIONS.DISABLE]: (uuid) => this.disableNode(uuid),
                [NODES_BULK_ACTIONS.RESTART]: (uuid) => this.restartNode(uuid),
                [NODES_BULK_ACTIONS.RESET_TRAFFIC]: (uuid) => this.resetNodeTraffic(uuid),
            };

            const handler = actionMap[action];
            if (!handler) {
                this.logger.error(`Invalid action: ${action}`);
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            for (const uuid of uuids) {
                await handler(uuid);
            }

            return ok(new BaseEventResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getExpectedUsers(uuid: string): Promise<TResult<ExpectedUserRow[]>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }
            const users = await this.nodesRepository.getExpectedUsersForNode(uuid);
            return ok(users);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getActualUsers(uuid: string): Promise<
        TResult<{
            users: Array<{ username: string; inboundTags: string[] }>;
            unreachableTags: string[];
        }>
    > {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const tags = (node.activeInbounds ?? []).map((ib) => ib.tag);
            if (tags.length === 0) {
                return ok({ users: [], unreachableTags: [] });
            }

            const usersByUsername = new Map<string, Set<string>>();
            const unreachableTags: string[] = [];

            await Promise.all(
                tags.map(async (tag) => {
                    const result = await this.axiosService.getInboundUsers(
                        { tag },
                        node.address,
                        node.port,
                    );
                    if (!result.isOk) {
                        unreachableTags.push(tag);
                        return;
                    }
                    for (const u of result.response.response.users) {
                        const set = usersByUsername.get(u.username) ?? new Set<string>();
                        set.add(tag);
                        usersByUsername.set(u.username, set);
                    }
                }),
            );

            const users = [...usersByUsername.entries()]
                .map(([username, tagSet]) => ({
                    username,
                    inboundTags: [...tagSet].sort(),
                }))
                .sort((a, b) => a.username.localeCompare(b.username));

            return ok({ users, unreachableTags });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Reconcile a node's xray with the panel DB. ACTIVE users from `expected`
     * that are missing on xray for a given inbound tag get a synchronous
     * AddUser RPC; users on xray that aren't in `expected` get a synchronous
     * RemoveUser RPC. Read-modify-write: this replaces the unreliable
     * AddUserToNodeEvent push (BDT-27) for new-user provisioning. Designed
     * to be called every cycle by compono-relay-sync — idempotent when the
     * node is converged.
     *
     * Safety cap: if the proposed deletions exceed BOTH 10 absolute AND 50%
     * of the live xray population, the call returns skipped=true with no
     * mutations. Tunable via `RECONCILE_MAX_STALE_RATIO` (default 0.5) and
     * `RECONCILE_MAX_STALE_ABSOLUTE` (default 10).
     */
    public async reconcileUsers(uuid: string): Promise<TResult<ReconcileUsersResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const nodeTags = (node.activeInbounds ?? []).map((ib) => ib.tag);
            if (nodeTags.length === 0) {
                reconcileRunsTotal.inc({ node_uuid: uuid, outcome: 'skipped' });
                return ok(
                    new ReconcileUsersResponseModel({
                        nodeUuid: uuid,
                        added: [],
                        removed: [],
                        errors: [],
                        unreachableTags: [],
                        skipped: true,
                        skipReason: 'node has no active inbounds',
                    }),
                );
            }

            // Pull both sides concurrently. Expected goes against the panel DB,
            // actual hits the node directly via the existing getActualUsers
            // path (mTLS+JWT to xray), so a node-side outage degrades to a
            // skip rather than a wipe.
            const [expectedResult, actualResult] = await Promise.all([
                this.fetchExpectedForReconcile(uuid),
                this.getActualUsers(uuid),
            ]);

            if (!expectedResult.isOk) {
                reconcileErrorsTotal.inc({ node_uuid: uuid, phase: 'fetch_expected' });
                reconcileRunsTotal.inc({ node_uuid: uuid, outcome: 'error' });
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }
            if (!actualResult.isOk) {
                reconcileErrorsTotal.inc({ node_uuid: uuid, phase: 'fetch_actual' });
                reconcileRunsTotal.inc({ node_uuid: uuid, outcome: 'error' });
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            const expectedUsers = expectedResult.response;
            const { users: actualUsers, unreachableTags } = actualResult.response;

            // If the panel was unable to read xray for a tag, refuse to remove
            // anything for that tag — we'd be deleting based on stale info.
            const reachableTags = nodeTags.filter((t) => !unreachableTags.includes(t));

            const expectedForDiff: ReconcileExpectedUser[] = expectedUsers.map((u) => ({
                tId: u.tId,
                inboundTags: u.inbounds.map((ib) => ib.tag),
            }));
            const diff = computeReconcileDiff({
                expected: expectedForDiff,
                actual: actualUsers,
                nodeTags: reachableTags,
            });

            const maxStaleRatio = Number(process.env.RECONCILE_MAX_STALE_RATIO ?? '0.5');
            const maxStaleAbsolute = Number(process.env.RECONCILE_MAX_STALE_ABSOLUTE ?? '10');
            const cap = evaluateSafetyCap({
                actualTotal: diff.actualTotal,
                staleTotal: diff.staleTotal,
                maxStaleRatio,
                maxStaleAbsolute,
            });
            if (cap.refused) {
                this.logger.warn(
                    `reconcileUsers ${uuid}: refused — ${cap.reason}. expected=${diff.expectedTotal} actual=${diff.actualTotal} stale=${diff.staleTotal}`,
                );
                reconcileErrorsTotal.inc({ node_uuid: uuid, phase: 'safety_cap' });
                reconcileRunsTotal.inc({ node_uuid: uuid, outcome: 'skipped' });
                return ok(
                    new ReconcileUsersResponseModel({
                        nodeUuid: uuid,
                        added: [],
                        removed: [],
                        errors: [],
                        unreachableTags,
                        skipped: true,
                        skipReason: cap.reason,
                    }),
                );
            }

            // Phase 1: add missing. Build one combined AddUser RPC per node so
            // we make a single network call regardless of how many users drift.
            const usersByTId = new Map(expectedUsers.map((u) => [String(u.tId), u]));
            const addEntries: AddUserToNodeCommandSdk.Request['data'] = [];
            const addedByUser = new Map<string, Set<string>>();
            const addErrors: ReconcileUserError[] = [];
            for (const { tag, missing } of diff.perTag) {
                for (const username of missing) {
                    const u = usersByTId.get(username);
                    if (!u) {
                        addErrors.push({
                            username,
                            tag,
                            phase: 'add',
                            error: 'expected user disappeared between fetch and apply',
                        });
                        continue;
                    }
                    const inbound = u.inbounds.find((ib) => ib.tag === tag);
                    if (!inbound) {
                        addErrors.push({
                            username,
                            tag,
                            phase: 'add',
                            error: 'tag not present in expected user inbounds',
                        });
                        continue;
                    }
                    const entry = this.buildAddUserEntry(u, inbound);
                    if (!entry) {
                        addErrors.push({
                            username,
                            tag,
                            phase: 'add',
                            error: `unsupported inbound type ${inbound.type}`,
                        });
                        continue;
                    }
                    addEntries.push(entry);
                    let tagSet = addedByUser.get(username);
                    if (!tagSet) {
                        tagSet = new Set<string>();
                        addedByUser.set(username, tagSet);
                    }
                    tagSet.add(tag);
                }
            }

            if (addEntries.length > 0) {
                // hashData.vlessUuid is used by the node's cache layer; pick
                // the first user's vlessUuid so we always satisfy the schema.
                // It's per-RPC, not per-entry, so the precise value doesn't
                // matter for correctness — only that it's a valid UUID.
                const firstUser = expectedUsers.find((u) =>
                    addEntries.some((e) => e.username === String(u.tId)),
                );
                const hashUuid = firstUser?.vlessUuid ?? expectedUsers[0]?.vlessUuid;
                if (!hashUuid) {
                    addErrors.push({
                        username: '<batch>',
                        tag: '<batch>',
                        phase: 'add',
                        error: 'no expected user available to source hashData.vlessUuid',
                    });
                } else {
                    const result = await this.axiosService.addUser(
                        {
                            data: addEntries,
                            hashData: { vlessUuid: hashUuid },
                        },
                        node.address,
                        node.port,
                    );
                    if (!result.isOk) {
                        const msg =
                            (result as { message?: string }).message ?? 'addUser RPC failed';
                        // Whole batch failed — book one error per (user,tag).
                        for (const e of addEntries) {
                            addErrors.push({
                                username: e.username,
                                tag: e.tag,
                                phase: 'add',
                                error: msg,
                            });
                            reconcileErrorsTotal.inc({ node_uuid: uuid, phase: 'add' });
                        }
                        // Do not increment add counter on failure.
                        addedByUser.clear();
                    } else {
                        for (const e of addEntries) {
                            reconcileAddedTotal.inc({ node_uuid: uuid, tag: e.tag });
                        }
                    }
                }
            }

            // Phase 2: remove stale. Per-user RPC since RemoveUser doesn't
            // accept a batch shape. We need vless_uuid even for users no
            // longer ACTIVE — the node uses it as a cache key.
            const staleTIds = new Set<number>();
            for (const { stale } of diff.perTag) {
                for (const username of stale) {
                    const n = Number(username);
                    if (Number.isFinite(n)) staleTIds.add(n);
                }
            }
            const vlessByTId = await this.nodesRepository.findVlessUuidsByTIds([...staleTIds]);

            const removedByUser = new Map<string, Set<string>>();
            const removeErrors: ReconcileUserError[] = [];
            for (const { tag, stale } of diff.perTag) {
                for (const username of stale) {
                    let tagSet = removedByUser.get(username);
                    if (!tagSet) {
                        tagSet = new Set<string>();
                        removedByUser.set(username, tagSet);
                    }
                    tagSet.add(tag);
                }
            }
            // RemoveUser is per-user (not per-tag); xray identifies users by
            // username globally on the node. So we issue ONE remove per stale
            // username, not one per (username,tag) pair.
            for (const [username, tags] of removedByUser) {
                const vlessUuid =
                    vlessByTId.get(username) ??
                    // Fallback: if user truly vanished from DB, send a zero
                    // UUID. The node will still drop them by username.
                    '00000000-0000-0000-0000-000000000000';
                const result = await this.axiosService.deleteUser(
                    { username, hashData: { vlessUuid } },
                    node.address,
                    node.port,
                );
                if (!result.isOk) {
                    for (const tag of tags) {
                        removeErrors.push({
                            username,
                            tag,
                            phase: 'remove',
                            error: 'deleteUser RPC failed',
                        });
                        reconcileErrorsTotal.inc({ node_uuid: uuid, phase: 'remove' });
                    }
                    removedByUser.delete(username);
                } else {
                    for (const tag of tags) {
                        reconcileRemovedTotal.inc({ node_uuid: uuid, tag });
                    }
                }
            }

            const added: ReconcileUserChange[] = [...addedByUser.entries()]
                .map(([username, ts]) => ({ username, tags: [...ts].sort() }))
                .sort((a, b) => a.username.localeCompare(b.username));
            const removed: ReconcileUserChange[] = [...removedByUser.entries()]
                .map(([username, ts]) => ({ username, tags: [...ts].sort() }))
                .sort((a, b) => a.username.localeCompare(b.username));
            const errors = [...addErrors, ...removeErrors];

            reconcileRunsTotal.inc({
                node_uuid: uuid,
                outcome: errors.length > 0 ? 'error' : 'ok',
            });

            return ok(
                new ReconcileUsersResponseModel({
                    nodeUuid: uuid,
                    added,
                    removed,
                    errors,
                    unreachableTags,
                    skipped: false,
                    skipReason: null,
                }),
            );
        } catch (error) {
            this.logger.error(`reconcileUsers ${uuid}: ${error}`);
            reconcileErrorsTotal.inc({ node_uuid: uuid, phase: 'unhandled' });
            reconcileRunsTotal.inc({ node_uuid: uuid, outcome: 'error' });
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    private async fetchExpectedForReconcile(
        uuid: string,
    ): Promise<TResult<ExpectedUserForReconcile[]>> {
        try {
            const users = await this.nodesRepository.getExpectedUsersForReconcile(uuid);
            return ok(users);
        } catch (error) {
            this.logger.error(`fetchExpectedForReconcile ${uuid}: ${error}`);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    private buildAddUserEntry(
        user: ExpectedUserForReconcile,
        inbound: ExpectedUserForReconcile['inbounds'][number],
    ): AddUserToNodeCommandSdk.Request['data'][number] | null {
        // Mirror src/modules/nodes/events/add-user-to-node/add-user-to-node.handler.ts
        // — we MUST produce the same payload shape, otherwise the user shows up
        // with a different vlessUuid/password than their subscription URL and
        // they connect-but-no-internet anyway.
        const username = user.tId.toString();
        switch (inbound.type) {
            case 'trojan':
                return {
                    type: 'trojan',
                    username,
                    password: user.trojanPassword,
                    tag: inbound.tag,
                };
            case 'vless':
                return {
                    type: 'vless',
                    username,
                    uuid: user.vlessUuid,
                    flow: getVlessFlowFromDbInbound(
                        new ConfigProfileInboundEntity({
                            tag: inbound.tag,
                            type: inbound.type,
                            network: inbound.network,
                            security: inbound.security,
                            rawInbound: inbound.rawInbound as object | null,
                        }),
                    ),
                    tag: inbound.tag,
                };
            case 'shadowsocks':
                return {
                    type: 'shadowsocks',
                    username,
                    password: user.ssPassword,
                    tag: inbound.tag,
                    cipherType: CipherType.CHACHA20_POLY1305,
                    ivCheck: false,
                };
            default:
                return null;
        }
    }
}
