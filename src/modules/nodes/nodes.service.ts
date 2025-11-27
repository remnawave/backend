import { Prisma } from '@prisma/client';

import { StartAllNodesQueueService } from 'src/queue/start-all-nodes/start-all-nodes.service';
import { ERRORS, EVENTS } from '@contract/constants';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { toNano } from '@common/utils/nano';
import { wrapBigInt } from '@common/utils';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { CreateNodeTrafficUsageHistoryCommand } from '@modules/nodes-traffic-usage-history/commands/create-node-traffic-usage-history';
import { NodesTrafficUsageHistoryEntity } from '@modules/nodes-traffic-usage-history/entities/nodes-traffic-usage-history.entity';
import { GetConfigProfileByUuidQuery } from '@modules/config-profiles/queries/get-config-profile-by-uuid';

import { StartAllNodesByProfileQueueService } from '@queue/start-all-nodes-by-profile';
import { StartNodeQueueService } from '@queue/start-node/start-node.service';
import { StopNodeQueueService } from '@queue/stop-node/stop-node.service';

import {
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
        private readonly startAllNodesQueue: StartAllNodesQueueService,
        private readonly startAllNodesByProfileQueueService: StartAllNodesByProfileQueueService,
        private readonly startNodeQueue: StartNodeQueueService,
        private readonly stopNodeQueue: StopNodeQueueService,
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    public async createNode(body: CreateNodeRequestDto): Promise<ICommandResponse<NodesEntity>> {
        try {
            const { configProfile, ...nodeData } = body;

            const nodeEntity = new NodesEntity({
                ...nodeData,
                address: nodeData.address.trim(),
                isConnected: false,
                isConnecting: false,
                isDisabled: false,
                isNodeOnline: false,
                isXrayRunning: false,
                trafficLimitBytes: wrapBigInt(nodeData.trafficLimitBytes),
                consumptionMultiplier: nodeData.consumptionMultiplier
                    ? toNano(nodeData.consumptionMultiplier)
                    : undefined,
                activeConfigProfileUuid: configProfile.activeConfigProfileUuid,
            });

            const result = await this.nodesRepository.create(nodeEntity);

            if (configProfile) {
                const configProfileResponse = await this.queryBus.execute(
                    new GetConfigProfileByUuidQuery(configProfile.activeConfigProfileUuid),
                );

                if (configProfileResponse.isOk && configProfileResponse.response) {
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
                        return {
                            isOk: false,
                            ...ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE,
                        };
                    }
                }
            }

            const node = await this.nodesRepository.findByUUID(result.uuid);

            if (!node) {
                throw new Error('Node not found');
            }

            await this.startNodeQueue.startNode({
                nodeUuid: node.uuid,
            });

            this.eventEmitter.emit(EVENTS.NODE.CREATED, new NodeEvent(node, EVENTS.NODE.CREATED));

            return {
                isOk: true,
                response: result,
            };
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
                    return { isOk: false, ...ERRORS.NODE_NAME_ALREADY_EXISTS };
                }
                if (fields.includes('address')) {
                    return { isOk: false, ...ERRORS.NODE_ADDRESS_ALREADY_EXISTS };
                }
            }

            return { isOk: false, ...ERRORS.CREATE_NODE_ERROR };
        }
    }

    public async getAllNodes(): Promise<ICommandResponse<NodesEntity[]>> {
        try {
            return {
                isOk: true,
                response: await this.nodesRepository.findByCriteria({}),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_ALL_NODES_ERROR,
            };
        }
    }

    public async restartNode(uuid: string): Promise<ICommandResponse<RestartNodeResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
            }

            if (node.isDisabled) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_IS_DISABLED,
                };
            }

            await this.startNodeQueue.startNode({
                nodeUuid: node.uuid,
            });

            return {
                isOk: true,
                response: new RestartNodeResponseModel(true),
            };
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return {
                isOk: false,
                ...ERRORS.RESTART_NODE_ERROR,
            };
        }
    }

    public async resetNodeTraffic(uuid: string): Promise<ICommandResponse<BaseEventResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
            }

            await this.commandBus.execute<
                CreateNodeTrafficUsageHistoryCommand,
                ICommandResponse<NodesTrafficUsageHistoryEntity>
            >(
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

            return {
                isOk: true,
                response: new BaseEventResponseModel(true),
            };
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return {
                isOk: false,
                ...ERRORS.RESET_NODE_TRAFFIC_ERROR,
            };
        }
    }

    public async restartAllNodes(
        forceRestart?: boolean,
    ): Promise<ICommandResponse<RestartNodeResponseModel>> {
        try {
            const nodes = await this.nodesRepository.findByCriteria({
                isDisabled: false,
            });
            if (nodes.length === 0) {
                return {
                    isOk: false,
                    ...ERRORS.ENABLED_NODES_NOT_FOUND,
                };
            }

            await this.startAllNodesQueue.startAllNodes({
                emitter: NodesService.name,
                force: forceRestart ?? false,
            });

            return {
                isOk: true,
                response: new RestartNodeResponseModel(true),
            };
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return {
                isOk: false,
                ...ERRORS.RESTART_NODE_ERROR,
            };
        }
    }

    public async getOneNode(uuid: string): Promise<ICommandResponse<NodesEntity>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: node,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_ONE_NODE_ERROR,
            };
        }
    }

    public async deleteNode(uuid: string): Promise<ICommandResponse<DeleteNodeResponseModel>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
            }

            await this.stopNodeQueue.stopNode({
                nodeUuid: node.uuid,
                isNeedToBeDeleted: true,
            });

            this.eventEmitter.emit(EVENTS.NODE.DELETED, new NodeEvent(node, EVENTS.NODE.DELETED));

            return {
                isOk: true,
                response: new DeleteNodeResponseModel({
                    isDeleted: true,
                }),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_NODE_ERROR,
            };
        }
    }

    public async updateNode(body: UpdateNodeRequestDto): Promise<ICommandResponse<NodesEntity>> {
        try {
            const { configProfile, ...nodeData } = body;

            const node = await this.nodesRepository.findByUUID(body.uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
            }

            if (configProfile) {
                const configProfileResponse = await this.queryBus.execute(
                    new GetConfigProfileByUuidQuery(configProfile.activeConfigProfileUuid),
                );

                if (configProfileResponse.isOk && configProfileResponse.response) {
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
                        return {
                            isOk: false,
                            ...ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE,
                        };
                    }
                }
            }

            const result = await this.nodesRepository.update({
                ...nodeData,
                address: nodeData.address ? nodeData.address.trim() : undefined,
                trafficLimitBytes: wrapBigInt(nodeData.trafficLimitBytes),
                consumptionMultiplier: nodeData.consumptionMultiplier
                    ? toNano(nodeData.consumptionMultiplier)
                    : undefined,
                activeConfigProfileUuid: configProfile?.activeConfigProfileUuid,
            });

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.UPDATE_NODE_ERROR,
                };
            }

            if (!node.isDisabled) {
                await this.startNodeQueue.startNode({
                    nodeUuid: result.uuid,
                });
            }

            this.eventEmitter.emit(
                EVENTS.NODE.MODIFIED,
                new NodeEvent(result, EVENTS.NODE.MODIFIED),
            );

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ENABLE_NODE_ERROR,
            };
        }
    }

    public async enableNode(uuid: string): Promise<ICommandResponse<NodesEntity>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
            }

            if (!node.activeConfigProfileUuid || node.activeInbounds.length === 0) {
                const result = await this.nodesRepository.update({
                    uuid: node.uuid,
                    isDisabled: true,
                    activeConfigProfileUuid: null,
                    isConnecting: false,
                    isXrayRunning: false,
                    isNodeOnline: false,
                    isConnected: false,
                    lastStatusMessage: null,
                    lastStatusChange: new Date(),
                    usersOnline: 0,
                });

                if (!result) {
                    return {
                        isOk: false,
                        ...ERRORS.ENABLE_NODE_ERROR,
                    };
                }

                return {
                    isOk: true,
                    response: result,
                };
            }

            const result = await this.nodesRepository.update({
                uuid: node.uuid,
                isDisabled: false,
            });

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.ENABLE_NODE_ERROR,
                };
            }

            await this.startNodeQueue.startNode({
                nodeUuid: result.uuid,
            });

            this.eventEmitter.emit(EVENTS.NODE.ENABLED, new NodeEvent(result, EVENTS.NODE.ENABLED));

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ENABLE_NODE_ERROR,
            };
        }
    }

    public async disableNode(uuid: string): Promise<ICommandResponse<NodesEntity>> {
        try {
            const node = await this.nodesRepository.findByUUID(uuid);
            if (!node) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_NOT_FOUND,
                };
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
                isXrayRunning: false,
                isNodeOnline: false,
                isConnected: false,
                lastStatusMessage: null,
                lastStatusChange: new Date(),
                usersOnline: 0,
            });

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.DISABLE_NODE_ERROR,
                };
            }

            await this.stopNodeQueue.stopNode({
                nodeUuid: result.uuid,
                isNeedToBeDeleted: false,
            });

            this.eventEmitter.emit(
                EVENTS.NODE.DISABLED,
                new NodeEvent(result, EVENTS.NODE.DISABLED),
            );

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ENABLE_NODE_ERROR,
            };
        }
    }

    public async reorderNodes(
        dto: ReorderNodeRequestDto,
    ): Promise<ICommandResponse<NodesEntity[]>> {
        try {
            await this.nodesRepository.reorderMany(dto.nodes);

            return {
                isOk: true,
                response: await this.nodesRepository.findByCriteria({}),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.REORDER_NODES_ERROR };
        }
    }

    public async getAllNodesTags(): Promise<ICommandResponse<string[]>> {
        try {
            return {
                isOk: true,
                response: await this.nodesRepository.findAllTags(),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.INTERNAL_SERVER_ERROR };
        }
    }

    public async profileModification(
        body: ProfileModificationRequestDto,
    ): Promise<ICommandResponse<BaseEventResponseModel>> {
        try {
            const { uuids, configProfile } = body;

            const configProfileResponse = await this.queryBus.execute(
                new GetConfigProfileByUuidQuery(configProfile.activeConfigProfileUuid),
            );

            if (!configProfileResponse.isOk || !configProfileResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            const inbounds = configProfileResponse.response.inbounds;

            const allActiveInboundsExistInProfile = configProfile.activeInbounds.every(
                (activeInboundUuid) =>
                    inbounds.some((inbound) => inbound.uuid === activeInboundUuid),
            );

            if (!allActiveInboundsExistInProfile) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE,
                };
            }

            await this.nodesRepository.removeInboundsFromNodes(uuids);

            await this.nodesRepository.addInboundsToNodes(uuids, configProfile.activeInbounds);

            await this.startAllNodesByProfileQueueService.startAllNodesByProfile({
                profileUuid: configProfile.activeConfigProfileUuid,
                emitter: 'bulkProfileModification',
            }); // no need to restart all nodes

            return {
                isOk: true,
                response: new BaseEventResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.INTERNAL_SERVER_ERROR };
        }
    }
}
