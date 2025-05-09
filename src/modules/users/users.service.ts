import relativeTime from 'dayjs/plugin/relativeTime';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS, USERS_STATUS, EVENTS } from '@libs/contracts/constants';
import { GetAllUsersCommand } from '@libs/contracts/commands';

import { UserEvent } from '@integration-modules/telegram-bot/events/users/interfaces';

import { DeleteManyActiveInboundsByUserUuidCommand } from '@modules/inbounds/commands/delete-many-active-inbounds-by-user-uuid';
import { GetUserLastConnectedNodeQuery } from '@modules/nodes-user-usage-history/queries/get-user-last-connected-node';
import { RemoveInboundsFromUsersByUuidsCommand } from '@modules/inbounds/commands/remove-inbounds-from-users-by-uuids';
import { CreateUserTrafficHistoryCommand } from '@modules/user-traffic-history/commands/create-user-traffic-history';
import { CreateManyUserActiveInboundsCommand } from '@modules/inbounds/commands/create-many-user-active-inbounds';
import { AddInboundsToUsersByUuidsCommand } from '@modules/inbounds/commands/add-inbounds-to-users-by-uuids';
import { GetUserUsageByRangeQuery } from '@modules/nodes-user-usage-history/queries/get-user-usage-by-range';
import { RemoveUserFromNodeEvent } from '@modules/nodes/events/remove-user-from-node';
import { ILastConnectedNode } from '@modules/nodes-user-usage-history/interfaces';
import { GetAllInboundsQuery } from '@modules/inbounds/queries/get-all-inbounds';
import { AddUserToNodeEvent } from '@modules/nodes/events/add-user-to-node';
import { UserTrafficHistoryEntity } from '@modules/user-traffic-history';
import { InboundsEntity } from '@modules/inbounds/entities';

import { BulkUserOperationsQueueService } from '@queue/bulk-user-operations/bulk-user-operations.service';
import { ResetUserTrafficQueueService } from '@queue/reset-user-traffic/reset-user-traffic.service';
import { StartAllNodesQueueService } from '@queue/start-all-nodes/start-all-nodes.service';

import {
    CreateUserRequestDto,
    UpdateUserRequestDto,
    BulkDeleteUsersByStatusRequestDto,
    BulkUpdateUsersRequestDto,
    BulkAllUpdateUsersRequestDto,
} from './dtos';
import {
    UserWithActiveInboundsEntity,
    UserEntity,
    UserWithAiAndLcnRawEntity,
    UserWithActiveInboundsAndLastConnectedNodeEntity,
} from './entities';
import {
    DeleteUserResponseModel,
    BulkDeleteByStatusResponseModel,
    BulkOperationResponseModel,
    BulkAllResponseModel,
} from './models';
import {
    IGetUserWithLastConnectedNode,
    IGetUserByUnique,
    IGetUsersByTelegramIdOrEmail,
    IGetUserUsageByRange,
} from './interfaces';
import { UpdateStatusAndTrafficAndResetAtCommand } from './commands/update-status-and-traffic-and-reset-at';
import { UsersRepository } from './repositories/users.repository';

dayjs.extend(utc);
dayjs.extend(relativeTime);

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private readonly shortUuidLength: number;

    constructor(
        private readonly userRepository: UsersRepository,
        private readonly commandBus: CommandBus,
        private readonly eventBus: EventBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly bulkUserOperationsQueueService: BulkUserOperationsQueueService,
        private readonly startAllNodesQueue: StartAllNodesQueueService,
        private readonly resetUserTrafficQueueService: ResetUserTrafficQueueService,
    ) {
        this.shortUuidLength = this.configService.getOrThrow<number>('SHORT_UUID_LENGTH');
    }

    public async createUser(
        dto: CreateUserRequestDto,
    ): Promise<ICommandResponse<UserWithActiveInboundsEntity>> {
        const user = await this.createUserTransactional(dto);

        if (!user.isOk || !user.response) {
            return user;
        }

        this.eventBus.publish(new AddUserToNodeEvent(user.response));
        this.eventEmitter.emit(
            EVENTS.USER.CREATED,
            new UserEvent(user.response, EVENTS.USER.CREATED),
        );
        return user;
    }

    public async updateUser(
        dto: UpdateUserRequestDto,
    ): Promise<ICommandResponse<IGetUserWithLastConnectedNode>> {
        const user = await this.updateUserTransactional(dto);

        if (!user.isOk || !user.response) {
            if (user.code === 'A025') {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            return {
                isOk: false,
                ...ERRORS.UPDATE_USER_ERROR,
            };
        }

        if (
            user.response.user.status === USERS_STATUS.ACTIVE &&
            user.response.isNeedToBeAddedToNode
        ) {
            this.eventBus.publish(new AddUserToNodeEvent(user.response.user));
        }

        if (user.response.isNeedToBeRemovedFromNode) {
            this.eventBus.publish(new RemoveUserFromNodeEvent(user.response.user));
        }

        this.eventEmitter.emit(
            EVENTS.USER.MODIFIED,
            new UserEvent(user.response.user, EVENTS.USER.MODIFIED),
        );

        const lastConnectedNode = await this.getUserLastConnectedNode(user.response.user.uuid);

        return {
            isOk: true,
            response: {
                user: user.response.user,
                lastConnectedNode: lastConnectedNode.response || null,
            },
        };
    }

    @Transactional()
    public async updateUserTransactional(dto: UpdateUserRequestDto): Promise<
        ICommandResponse<{
            isNeedToBeAddedToNode: boolean;
            isNeedToBeRemovedFromNode: boolean;
            user: UserWithActiveInboundsEntity;
        }>
    > {
        try {
            const {
                uuid,
                expireAt,
                trafficLimitBytes,
                trafficLimitStrategy,
                status,
                activeUserInbounds,
                description,
                telegramId,
                email,
                hwidDeviceLimit,
                tag,
            } = dto;

            const user = await this.userRepository.getUserByUUID(uuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            let newStatus = status;

            let isNeedToBeAddedToNode =
                user.status !== USERS_STATUS.ACTIVE && status === USERS_STATUS.ACTIVE;

            const isNeedToBeRemovedFromNode = status !== USERS_STATUS.DISABLED;

            if (trafficLimitBytes !== undefined) {
                if (user.status === USERS_STATUS.LIMITED && trafficLimitBytes >= 0) {
                    if (
                        BigInt(trafficLimitBytes) > user.trafficLimitBytes ||
                        trafficLimitBytes === 0
                    ) {
                        newStatus = USERS_STATUS.ACTIVE;
                        isNeedToBeAddedToNode = true;
                    }
                }
            }

            if (user.status === USERS_STATUS.EXPIRED && expireAt && !status) {
                const newExpireDate = dayjs.utc(expireAt);
                const currentExpireDate = dayjs.utc(user.expireAt);
                const now = dayjs.utc();

                if (currentExpireDate !== newExpireDate) {
                    if (newExpireDate.isAfter(currentExpireDate) && newExpireDate.isAfter(now)) {
                        newStatus = USERS_STATUS.ACTIVE;
                        isNeedToBeAddedToNode = true;
                    }
                }
            }

            const result = await this.userRepository.update({
                uuid: user.uuid,
                expireAt: expireAt ? new Date(expireAt) : undefined,
                trafficLimitBytes:
                    trafficLimitBytes !== undefined ? BigInt(trafficLimitBytes) : undefined,
                trafficLimitStrategy: trafficLimitStrategy || undefined,
                status: newStatus || undefined,
                description: description,
                telegramId:
                    telegramId !== undefined
                        ? telegramId === null
                            ? null
                            : BigInt(telegramId)
                        : undefined,
                email: email,
                hwidDeviceLimit: hwidDeviceLimit,
                tag: tag,
            });

            if (activeUserInbounds) {
                const newInboundUuids = activeUserInbounds;

                const currentInboundUuids =
                    user.activeUserInbounds?.map((inbound) => inbound.uuid) || [];

                const hasChanges =
                    newInboundUuids.length !== currentInboundUuids.length ||
                    !newInboundUuids.every((uuid) => currentInboundUuids.includes(uuid));

                if (hasChanges) {
                    await this.deleteManyActiveInboubdsByUserUuid({
                        userUuid: result.uuid,
                    });

                    const inboundResult = await this.createManyUserActiveInbounds({
                        userUuid: result.uuid,
                        inboundUuids: newInboundUuids,
                    });

                    isNeedToBeAddedToNode = true;

                    if (!inboundResult.isOk) {
                        return {
                            isOk: false,
                            ...ERRORS.UPDATE_USER_WITH_INBOUNDS_ERROR,
                        };
                    }
                }
            }

            const userWithInbounds = await this.userRepository.getUserWithActiveInbounds(
                result.uuid,
            );

            if (!userWithInbounds) {
                return {
                    isOk: false,
                    ...ERRORS.CANT_GET_CREATED_USER_WITH_INBOUNDS,
                };
            }

            return {
                isOk: true,
                response: {
                    user: userWithInbounds,
                    isNeedToBeAddedToNode,
                    isNeedToBeRemovedFromNode,
                },
            };
        } catch (error) {
            this.logger.error(error);
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'Users' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('username')) {
                    return { isOk: false, ...ERRORS.USER_USERNAME_ALREADY_EXISTS };
                }
                if (fields.includes('shortUuid') || fields.includes('short_uuid')) {
                    return { isOk: false, ...ERRORS.USER_SHORT_UUID_ALREADY_EXISTS };
                }
                if (fields.includes('subscriptionUuid') || fields.includes('subscription_uuid')) {
                    return { isOk: false, ...ERRORS.USER_SUBSCRIPTION_UUID_ALREADY_EXISTS };
                }
            }

            return { isOk: false, ...ERRORS.UPDATE_USER_ERROR };
        }
    }

    @Transactional()
    public async createUserTransactional(
        dto: CreateUserRequestDto,
    ): Promise<ICommandResponse<UserWithActiveInboundsEntity>> {
        try {
            const {
                username,
                subscriptionUuid,
                expireAt,
                trafficLimitBytes,
                trafficLimitStrategy,
                status,
                shortUuid,
                trojanPassword,
                vlessUuid,
                ssPassword,
                activeUserInbounds,
                createdAt,
                lastTrafficResetAt,
                description,
                activateAllInbounds,
                telegramId,
                email,
                hwidDeviceLimit,
                tag,
            } = dto;

            const userEntity = new UserEntity({
                username,
                subscriptionUuid: subscriptionUuid || this.createUuid(),
                shortUuid: shortUuid || this.createNanoId(),
                trojanPassword: trojanPassword || this.createTrojanPassword(),
                vlessUuid: vlessUuid || this.createUuid(),
                ssPassword: ssPassword || this.createSSPassword(),
                status,
                trafficLimitBytes:
                    trafficLimitBytes !== undefined ? BigInt(trafficLimitBytes) : undefined,
                trafficLimitStrategy,
                email: email || null,
                telegramId: telegramId ? BigInt(telegramId) : null,
                expireAt: new Date(expireAt),
                createdAt: createdAt ? new Date(createdAt) : undefined,
                lastTrafficResetAt: lastTrafficResetAt ? new Date(lastTrafficResetAt) : undefined,
                description: description || undefined,
                hwidDeviceLimit: hwidDeviceLimit || null,
                tag: tag,
            });

            const result = await this.userRepository.create(userEntity);

            if (activeUserInbounds) {
                const inboundResult = await this.createManyUserActiveInbounds({
                    userUuid: result.uuid,
                    inboundUuids: activeUserInbounds,
                });
                if (!inboundResult.isOk) {
                    return {
                        isOk: false,
                        ...ERRORS.CREATE_USER_WITH_INBOUNDS_ERROR,
                    };
                }
            }

            if (
                activateAllInbounds === true &&
                (!activeUserInbounds || activeUserInbounds.length === 0)
            ) {
                const allInbounds = await this.getAllInbounds();

                if (!allInbounds.isOk || !allInbounds.response) {
                    return {
                        isOk: false,
                        ...ERRORS.GET_ALL_INBOUNDS_ERROR,
                    };
                }

                const inboundUuids = allInbounds.response.map((inbound) => inbound.uuid);

                const inboundResult = await this.createManyUserActiveInbounds({
                    userUuid: result.uuid,
                    inboundUuids: inboundUuids,
                });

                if (!inboundResult.isOk) {
                    return {
                        isOk: false,
                        ...ERRORS.CREATE_USER_WITH_INBOUNDS_ERROR,
                    };
                }
            }

            const userWithInbounds = await this.userRepository.getUserWithActiveInbounds(
                result.uuid,
            );

            if (!userWithInbounds) {
                return {
                    isOk: false,
                    ...ERRORS.CANT_GET_CREATED_USER_WITH_INBOUNDS,
                };
            }

            return {
                isOk: true,
                response: userWithInbounds,
            };
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'Users' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('username')) {
                    return { isOk: false, ...ERRORS.USER_USERNAME_ALREADY_EXISTS };
                }
                if (fields.includes('shortUuid') || fields.includes('short_uuid')) {
                    return { isOk: false, ...ERRORS.USER_SHORT_UUID_ALREADY_EXISTS };
                }
                if (fields.includes('subscriptionUuid') || fields.includes('subscription_uuid')) {
                    return { isOk: false, ...ERRORS.USER_SUBSCRIPTION_UUID_ALREADY_EXISTS };
                }
            }

            return { isOk: false, ...ERRORS.CREATE_USER_ERROR };
        }
    }

    public async getAllUsers(dto: GetAllUsersCommand.RequestQuery): Promise<
        ICommandResponse<{
            total: number;
            users: UserWithAiAndLcnRawEntity[];
        }>
    > {
        try {
            const [users, total] = await this.userRepository.getAllUsersV2(dto);

            return {
                isOk: true,
                response: {
                    users,
                    total,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_ALL_USERS_ERROR,
            };
        }
    }

    public async getUserByUniqueFields(
        dto: IGetUserByUnique,
    ): Promise<ICommandResponse<UserWithActiveInboundsAndLastConnectedNodeEntity>> {
        try {
            const result = await this.userRepository.findUniqueByCriteria({
                username: dto.username || undefined,
                subscriptionUuid: dto.subscriptionUuid || undefined,
                shortUuid: dto.shortUuid || undefined,
                uuid: dto.uuid || undefined,
            });

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.GET_USER_BY_UNIQUE_FIELDS_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_USER_BY_ERROR,
            };
        }
    }

    public async getUsersByTelegramIdOrEmail(
        dto: IGetUsersByTelegramIdOrEmail,
    ): Promise<ICommandResponse<UserWithActiveInboundsAndLastConnectedNodeEntity[]>> {
        try {
            const result = await this.userRepository.findByCriteriaWithInboundsAndLastConnectedNode(
                {
                    email: dto.email || undefined,
                    telegramId: dto.telegramId ? BigInt(dto.telegramId) : undefined,
                    tag: dto.tag || undefined,
                },
            );

            if (!result || result.length === 0) {
                return {
                    isOk: false,
                    ...ERRORS.USERS_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_USER_BY_ERROR,
            };
        }
    }

    public async revokeUserSubscription(
        userUuid: string,
    ): Promise<ICommandResponse<IGetUserWithLastConnectedNode>> {
        try {
            const user = await this.userRepository.getUserByUUID(userUuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }
            const updatedUser = await this.userRepository.updateUserWithActiveInbounds({
                uuid: user.uuid,
                shortUuid: this.createNanoId(),
                subscriptionUuid: this.createUuid(),
                trojanPassword: this.createTrojanPassword(),
                vlessUuid: this.createUuid(),
                ssPassword: this.createTrojanPassword(),
                subRevokedAt: new Date(),
            });

            if (updatedUser.status === USERS_STATUS.ACTIVE) {
                await this.eventBus.publish(new AddUserToNodeEvent(updatedUser));
            }

            this.eventEmitter.emit(
                EVENTS.USER.REVOKED,
                new UserEvent(updatedUser, EVENTS.USER.REVOKED),
            );

            const lastConnectedNode = await this.getUserLastConnectedNode(updatedUser.uuid);

            return {
                isOk: true,
                response: {
                    user: updatedUser,
                    lastConnectedNode: lastConnectedNode.response || null,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR,
            };
        }
    }

    public async activateAllInbounds(
        userUuid: string,
    ): Promise<ICommandResponse<IGetUserWithLastConnectedNode>> {
        try {
            const user = await this.userRepository.getUserByUUID(userUuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const allInbounds = await this.getAllInbounds();

            if (!allInbounds.isOk || !allInbounds.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_ALL_INBOUNDS_ERROR,
                };
            }

            const inboundUuids = allInbounds.response.map((inbound) => inbound.uuid);

            const inboundResult = await this.createManyUserActiveInbounds({
                userUuid: user.uuid,
                inboundUuids: inboundUuids,
            });

            if (!inboundResult.isOk) {
                return {
                    isOk: false,
                    ...ERRORS.ACTIVATE_ALL_INBOUNDS_ERROR,
                };
            }

            const updatedUser = await this.userRepository.getUserByUUID(user.uuid);

            if (!updatedUser) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            if (updatedUser.status === USERS_STATUS.ACTIVE) {
                await this.eventBus.publish(new AddUserToNodeEvent(updatedUser));
            }

            this.eventEmitter.emit(
                EVENTS.USER.MODIFIED,
                new UserEvent(updatedUser, EVENTS.USER.MODIFIED),
            );

            const lastConnectedNode = await this.getUserLastConnectedNode(updatedUser.uuid);

            return {
                isOk: true,
                response: {
                    user: updatedUser,
                    lastConnectedNode: lastConnectedNode.response || null,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ACTIVATE_ALL_INBOUNDS_ERROR,
            };
        }
    }

    public async deleteUser(userUuid: string): Promise<ICommandResponse<DeleteUserResponseModel>> {
        try {
            const user = await this.userRepository.getUserByUUID(userUuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }
            const result = await this.userRepository.deleteByUUID(user.uuid);

            this.eventBus.publish(new RemoveUserFromNodeEvent(user));
            this.eventEmitter.emit(EVENTS.USER.DELETED, new UserEvent(user, EVENTS.USER.DELETED));
            return {
                isOk: true,
                response: new DeleteUserResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.DELETE_USER_ERROR };
        }
    }

    public async disableUser(
        userUuid: string,
    ): Promise<ICommandResponse<IGetUserWithLastConnectedNode>> {
        try {
            const user = await this.userRepository.getUserByUUID(userUuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            if (user.status === USERS_STATUS.DISABLED) {
                return {
                    isOk: false,
                    ...ERRORS.USER_ALREADY_DISABLED,
                };
            }

            const updatedUser = await this.userRepository.updateUserWithActiveInbounds({
                uuid: user.uuid,
                status: USERS_STATUS.DISABLED,
            });

            this.eventBus.publish(new RemoveUserFromNodeEvent(user));
            this.eventEmitter.emit(
                EVENTS.USER.DISABLED,
                new UserEvent(updatedUser, EVENTS.USER.DISABLED),
            );

            const lastConnectedNode = await this.getUserLastConnectedNode(updatedUser.uuid);

            return {
                isOk: true,
                response: {
                    user: updatedUser,
                    lastConnectedNode: lastConnectedNode.response || null,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DISABLE_USER_ERROR,
            };
        }
    }

    public async enableUser(
        userUuid: string,
    ): Promise<ICommandResponse<IGetUserWithLastConnectedNode>> {
        try {
            const user = await this.userRepository.getUserByUUID(userUuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            if (user.status === USERS_STATUS.ACTIVE) {
                return {
                    isOk: false,
                    ...ERRORS.USER_ALREADY_ENABLED,
                };
            }

            const updatedUser = await this.userRepository.updateUserWithActiveInbounds({
                uuid: user.uuid,
                status: USERS_STATUS.ACTIVE,
            });

            this.eventBus.publish(new AddUserToNodeEvent(updatedUser));

            this.eventEmitter.emit(
                EVENTS.USER.ENABLED,
                new UserEvent(updatedUser, EVENTS.USER.ENABLED),
            );

            const lastConnectedNode = await this.getUserLastConnectedNode(updatedUser.uuid);

            return {
                isOk: true,
                response: {
                    user: updatedUser,
                    lastConnectedNode: lastConnectedNode.response || null,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ENABLE_USER_ERROR,
            };
        }
    }

    @Transactional()
    public async resetUserTraffic(
        userUuid: string,
    ): Promise<ICommandResponse<IGetUserWithLastConnectedNode>> {
        try {
            const user = await this.userRepository.getUserByUUID(userUuid);
            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            let status = undefined;

            if (user.status === USERS_STATUS.LIMITED) {
                status = USERS_STATUS.ACTIVE;
                this.eventEmitter.emit(
                    EVENTS.USER.ENABLED,
                    new UserEvent(user, EVENTS.USER.ENABLED),
                );
                this.eventBus.publish(new AddUserToNodeEvent(user));
            }

            await this.updateUserStatusAndTrafficAndResetAt({
                userUuid: user.uuid,
                lastResetAt: new Date(),
                status,
            });

            await this.createUserUsageHistory({
                userTrafficHistory: new UserTrafficHistoryEntity({
                    userUuid: user.uuid,
                    resetAt: new Date(),
                    usedBytes: BigInt(user.usedTrafficBytes),
                }),
            });

            const newUser = await this.userRepository.getUserByUUID(userUuid);
            if (!newUser) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const lastConnectedNode = await this.getUserLastConnectedNode(newUser.uuid);

            this.eventEmitter.emit(
                EVENTS.USER.TRAFFIC_RESET,
                new UserEvent(newUser, EVENTS.USER.TRAFFIC_RESET),
            );

            return {
                isOk: true,
                response: {
                    user: newUser,
                    lastConnectedNode: lastConnectedNode.response || null,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.RESET_USER_TRAFFIC_ERROR,
            };
        }
    }

    public async bulkDeleteUsersByStatus(
        dto: BulkDeleteUsersByStatusRequestDto,
    ): Promise<ICommandResponse<BulkDeleteByStatusResponseModel>> {
        try {
            const result = await this.userRepository.deleteManyByStatus(dto.status);

            return {
                isOk: true,
                response: new BulkDeleteByStatusResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_DELETE_USERS_BY_STATUS_ERROR,
            };
        }
    }

    public async bulkDeleteUsersByUuid(
        uuids: string[],
    ): Promise<ICommandResponse<BulkDeleteByStatusResponseModel>> {
        try {
            if (uuids.length === 0) {
                return {
                    isOk: true,
                    response: new BulkOperationResponseModel(0),
                };
            }

            const result = await this.userRepository.deleteManyByUuid(uuids);

            await this.startAllNodesQueue.startAllNodesWithoutDeduplication({
                emitter: 'bulkDeleteUsersByUuid',
            });

            return {
                isOk: true,
                response: new BulkOperationResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_DELETE_USERS_BY_UUID_ERROR,
            };
        }
    }

    public async bulkRevokeUsersSubscription(
        uuids: string[],
    ): Promise<ICommandResponse<BulkOperationResponseModel>> {
        try {
            // handled one by one
            await this.bulkUserOperationsQueueService.revokeUsersSubscriptionBulk(uuids);

            return {
                isOk: true,
                response: new BulkOperationResponseModel(uuids.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_REVOKE_USERS_SUBSCRIPTION_ERROR,
            };
        }
    }

    public async bulkResetUserTraffic(
        uuids: string[],
    ): Promise<ICommandResponse<BulkOperationResponseModel>> {
        try {
            // handled one by one
            await this.bulkUserOperationsQueueService.resetUserTrafficBulk(uuids);

            return {
                isOk: true,
                response: new BulkOperationResponseModel(uuids.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_RESET_USER_TRAFFIC_ERROR,
            };
        }
    }

    public async bulkUpdateUsers(
        dto: BulkUpdateUsersRequestDto,
    ): Promise<ICommandResponse<BulkOperationResponseModel>> {
        try {
            if (
                dto.fields.status === USERS_STATUS.EXPIRED ||
                dto.fields.status === USERS_STATUS.LIMITED
            ) {
                return {
                    isOk: false,
                    ...ERRORS.INVALID_USER_STATUS_ERROR,
                };
            }

            // handled one by one
            await this.bulkUserOperationsQueueService.updateUsersBulk({
                uuids: dto.uuids,
                fields: dto.fields,
            });

            return {
                isOk: true,
                response: new BulkOperationResponseModel(dto.uuids.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_UPDATE_USERS_ERROR,
            };
        }
    }

    public async bulkAddInboundsToUsers(
        usersUuids: string[],
        inboundUuids: string[],
    ): Promise<ICommandResponse<BulkOperationResponseModel>> {
        try {
            const usersLength = usersUuids.length;
            const batchLength = 3_000;

            for (let i = 0; i < usersLength; i += batchLength) {
                const batchUsersUuids = usersUuids.slice(i, i + batchLength);
                await this.removeInboundsFromUsers(batchUsersUuids);
                await this.addInboundsToUsers(batchUsersUuids, inboundUuids);
            }

            await this.startAllNodesQueue.startAllNodesWithoutDeduplication({
                emitter: 'bulkAddInboundsToUsers',
            });

            return {
                isOk: true,
                response: new BulkOperationResponseModel(usersLength),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_ADD_INBOUNDS_TO_USERS_ERROR,
            };
        }
    }

    public async bulkUpdateAllUsers(
        dto: BulkAllUpdateUsersRequestDto,
    ): Promise<ICommandResponse<BulkAllResponseModel>> {
        try {
            if (dto.status === USERS_STATUS.EXPIRED || dto.status === USERS_STATUS.LIMITED) {
                return {
                    isOk: false,
                    ...ERRORS.INVALID_USER_STATUS_ERROR,
                };
            }

            await this.userRepository.bulkUpdateAllUsers({
                ...dto,
                trafficLimitBytes:
                    dto.trafficLimitBytes !== undefined ? BigInt(dto.trafficLimitBytes) : undefined,
                telegramId:
                    dto.telegramId !== undefined
                        ? dto.telegramId === null
                            ? null
                            : BigInt(dto.telegramId)
                        : undefined,
            });

            if (dto.trafficLimitBytes !== undefined) {
                await this.userRepository.bulkSyncLimitedUsers();
            }

            if (dto.expireAt !== undefined) {
                await this.userRepository.bulkSyncExpiredUsers();
            }

            await this.startAllNodesQueue.startAllNodesWithoutDeduplication({
                emitter: 'bulkUpdateAllUsers',
            });

            return {
                isOk: true,
                response: new BulkAllResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_UPDATE_ALL_USERS_ERROR,
            };
        }
    }

    public async bulkAllResetUserTraffic(): Promise<ICommandResponse<BulkAllResponseModel>> {
        try {
            await this.resetUserTrafficQueueService.resetDailyUserTraffic();
            await this.resetUserTrafficQueueService.resetMonthlyUserTraffic();
            await this.resetUserTrafficQueueService.resetWeeklyUserTraffic();
            await this.resetUserTrafficQueueService.resetNoResetUserTraffic();

            await this.startAllNodesQueue.startAllNodesWithoutDeduplication({
                emitter: 'bulkAllResetUserTraffic',
            });

            return {
                isOk: true,
                response: new BulkAllResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.BULK_RESET_USER_TRAFFIC_ERROR,
            };
        }
    }

    public async getUserUsageByRange(
        userUuid: string,
        start: Date,
        end: Date,
    ): Promise<ICommandResponse<IGetUserUsageByRange[]>> {
        try {
            const startDate = dayjs(start).utc().toDate();
            const endDate = dayjs(end).utc().toDate();

            const result = await this.getUserUsageByRangeQuery(userUuid, startDate, endDate);

            if (!result.isOk) {
                return {
                    isOk: false,
                    ...ERRORS.GET_USER_USAGE_BY_RANGE_ERROR,
                };
            }

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_USER_USAGE_BY_RANGE_ERROR };
        }
    }

    public async getAllTags(): Promise<ICommandResponse<string[]>> {
        try {
            const result = await this.userRepository.getAllTags();

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_ALL_TAGS_ERROR };
        }
    }

    private createUuid(): string {
        return randomUUID();
    }

    private createNanoId(): string {
        const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghjkmnopqrstuvwxyz-';
        const nanoid = customAlphabet(alphabet, this.shortUuidLength);

        return nanoid();
    }

    private createTrojanPassword(): string {
        const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghjkmnopqrstuvwxyz-';
        const nanoid = customAlphabet(alphabet, 30);

        return nanoid();
    }

    private createSSPassword(): string {
        const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghjkmnopqrstuvwxyz-';
        const nanoid = customAlphabet(alphabet, 32);

        return nanoid();
    }

    private async createManyUserActiveInbounds(
        dto: CreateManyUserActiveInboundsCommand,
    ): Promise<ICommandResponse<number>> {
        return this.commandBus.execute<
            CreateManyUserActiveInboundsCommand,
            ICommandResponse<number>
        >(new CreateManyUserActiveInboundsCommand(dto.userUuid, dto.inboundUuids));
    }

    private async deleteManyActiveInboubdsByUserUuid(
        dto: DeleteManyActiveInboundsByUserUuidCommand,
    ): Promise<ICommandResponse<number>> {
        return this.commandBus.execute<
            DeleteManyActiveInboundsByUserUuidCommand,
            ICommandResponse<number>
        >(new DeleteManyActiveInboundsByUserUuidCommand(dto.userUuid));
    }

    private async updateUserStatusAndTrafficAndResetAt(
        dto: UpdateStatusAndTrafficAndResetAtCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<
            UpdateStatusAndTrafficAndResetAtCommand,
            ICommandResponse<void>
        >(new UpdateStatusAndTrafficAndResetAtCommand(dto.userUuid, dto.lastResetAt, dto.status));
    }

    private async createUserUsageHistory(
        dto: CreateUserTrafficHistoryCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<CreateUserTrafficHistoryCommand, ICommandResponse<void>>(
            new CreateUserTrafficHistoryCommand(dto.userTrafficHistory),
        );
    }

    private async getAllInbounds(): Promise<ICommandResponse<InboundsEntity[]>> {
        return this.queryBus.execute<GetAllInboundsQuery, ICommandResponse<InboundsEntity[]>>(
            new GetAllInboundsQuery(),
        );
    }

    private async getUserLastConnectedNode(
        userUuid: string,
    ): Promise<ICommandResponse<ILastConnectedNode | null>> {
        return this.queryBus.execute<
            GetUserLastConnectedNodeQuery,
            ICommandResponse<ILastConnectedNode | null>
        >(new GetUserLastConnectedNodeQuery(userUuid));
    }

    private async removeInboundsFromUsers(userUuids: string[]): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<
            RemoveInboundsFromUsersByUuidsCommand,
            ICommandResponse<void>
        >(new RemoveInboundsFromUsersByUuidsCommand(userUuids));
    }

    private async addInboundsToUsers(
        userUuids: string[],
        inboundUuids: string[],
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<AddInboundsToUsersByUuidsCommand, ICommandResponse<void>>(
            new AddInboundsToUsersByUuidsCommand(userUuids, inboundUuids),
        );
    }

    private async getUserUsageByRangeQuery(
        userUuid: string,
        start: Date,
        end: Date,
    ): Promise<ICommandResponse<IGetUserUsageByRange[]>> {
        return this.queryBus.execute<
            GetUserUsageByRangeQuery,
            ICommandResponse<IGetUserUsageByRange[]>
        >(new GetUserUsageByRangeQuery(userUuid, start, end));
    }
}
