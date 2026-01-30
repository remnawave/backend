import { Prisma } from '@prisma/client';

import { ERRORS, EVENTS, NODES_BULK_ACTIONS } from '@contract/constants';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { mapDefined, wrapBigInt } from '@common/utils';
import { fail, ok, TResult } from '@common/types';
import { toNano } from '@common/utils/nano';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { CreateNodeTrafficUsageHistoryCommand } from '@modules/nodes-traffic-usage-history/commands/create-node-traffic-usage-history';
import { NodesTrafficUsageHistoryEntity } from '@modules/nodes-traffic-usage-history/entities/nodes-traffic-usage-history.entity';
import { GetConfigProfileByUuidQuery } from '@modules/config-profiles/queries/get-config-profile-by-uuid';

import { NodesQueuesService } from '@queue/_nodes';

import {
    BulkNodesActionsRequestDto,
    CreateNodeRequestDto,
    ProfileModificationRequestDto,
    ReorderNodeRequestDto,
    UpdateNodeRequestDto,
} from './dtos';
import {
    BaseEventResponseModel,
    DeleteNodeResponseModel,
    RestartNodeResponseModel,
} from './models';
import { NodesRepository } from './repositories/nodes.repository';
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
}
