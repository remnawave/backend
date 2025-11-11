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
import { wrapBigInt, wrapBigIntNullable } from '@common/utils';
import { ERRORS, USERS_STATUS, EVENTS } from '@libs/contracts/constants';
import { GetAllUsersCommand } from '@libs/contracts/commands';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { GetUserSubscriptionRequestHistoryQuery } from '@modules/user-subscription-request-history/queries/get-user-subscription-request-history';
import { CreateUserTrafficHistoryCommand } from '@modules/user-traffic-history/commands/create-user-traffic-history';
import { GetUserUsageByRangeQuery } from '@modules/nodes-user-usage-history/queries/get-user-usage-by-range';
import { RemoveUserFromNodeEvent } from '@modules/nodes/events/remove-user-from-node';
import { AddUserToNodeEvent } from '@modules/nodes/events/add-user-to-node';
import { UserTrafficHistoryEntity } from '@modules/user-traffic-history';

import { BulkUserOperationsQueueService } from '@queue/bulk-user-operations/bulk-user-operations.service';
import { ResetUserTrafficQueueService } from '@queue/reset-user-traffic/reset-user-traffic.service';
import { StartAllNodesQueueService } from '@queue/start-all-nodes/start-all-nodes.service';
import { UserActionsQueueService } from '@queue/user-actions/user-actions.service';

import {
    DeleteUserResponseModel,
    BulkDeleteByStatusResponseModel,
    BulkOperationResponseModel,
    BulkAllResponseModel,
    GetUserAccessibleNodesResponseModel,
    GetUserSubscriptionRequestHistoryResponseModel,
} from './models';
import {
    CreateUserRequestDto,
    UpdateUserRequestDto,
    BulkDeleteUsersByStatusRequestDto,
    BulkUpdateUsersRequestDto,
    BulkAllUpdateUsersRequestDto,
} from './dtos';
import { IGetUserByUnique, IGetUsersByTelegramIdOrEmail, IGetUserUsageByRange } from './interfaces';
import { UsersRepository } from './repositories/users.repository';
import { BaseUserEntity, UserEntity } from './entities';

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
        private readonly userActionsQueueService: UserActionsQueueService,
    ) {
        this.shortUuidLength = this.configService.getOrThrow<number>('SHORT_UUID_LENGTH');
    }

    public async createUser(dto: CreateUserRequestDto): Promise<ICommandResponse<UserEntity>> {
        try {
            const user = await this.createUserTransactional(dto);

            if (!user.isOk || !user.response) {
                return user;
            }

            if (user.response.status === USERS_STATUS.ACTIVE) {
                this.eventBus.publish(new AddUserToNodeEvent(user.response.uuid));
            }

            this.eventEmitter.emit(
                EVENTS.USER.CREATED,
                new UserEvent({
                    user: user.response,
                    event: EVENTS.USER.CREATED,
                }),
            );
            return user;
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

            return { isOk: false, ...ERRORS.CREATE_USER_ERROR };
        }
    }

    public async updateUser(dto: UpdateUserRequestDto): Promise<ICommandResponse<UserEntity>> {
        try {
            const user = await this.updateUserTransactional(dto);

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.UPDATE_USER_ERROR,
                };
            }

            if (
                user.response.user.status === USERS_STATUS.ACTIVE &&
                user.response.isNeedToBeAddedToNode &&
                !user.response.isNeedToBeRemovedFromNode
            ) {
                this.eventBus.publish(new AddUserToNodeEvent(user.response.user.uuid));
            }

            if (user.response.isNeedToBeRemovedFromNode) {
                this.eventBus.publish(
                    new RemoveUserFromNodeEvent(
                        user.response.user.username,
                        user.response.user.vlessUuid,
                    ),
                );
            }

            this.eventEmitter.emit(
                EVENTS.USER.MODIFIED,
                new UserEvent({
                    user: user.response.user,
                    event: EVENTS.USER.MODIFIED,
                }),
            );

            return {
                isOk: true,
                response: user.response.user,
            };
        } catch (error) {
            if (error instanceof Error && error.message === ERRORS.USER_NOT_FOUND.code) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            if (
                error instanceof Error &&
                error.message === ERRORS.CANT_GET_CREATED_USER_WITH_INBOUNDS.code
            ) {
                return {
                    isOk: false,
                    ...ERRORS.CANT_GET_CREATED_USER_WITH_INBOUNDS,
                };
            }

            this.logger.error(error);

            return { isOk: false, ...ERRORS.UPDATE_USER_ERROR };
        }
    }

    @Transactional()
    public async updateUserTransactional(dto: UpdateUserRequestDto): Promise<
        ICommandResponse<{
            isNeedToBeAddedToNode: boolean;
            isNeedToBeRemovedFromNode: boolean;
            user: UserEntity;
        }>
    > {
        try {
            const {
                username,
                uuid,
                trafficLimitBytes,
                telegramId,
                activeInternalSquads,
                status,
                ...rest
            } = dto;

            const userCriteria = uuid ? { uuid } : { username };

            const user = await this.userRepository.findUniqueByCriteria(userCriteria, {
                activeInternalSquads: true,
                lastConnectedNode: false,
            });

            if (!user) {
                throw new Error(ERRORS.USER_NOT_FOUND.code);
            }

            const newUserEntity = new BaseUserEntity({
                ...rest,
                uuid: user.uuid,
                trafficLimitBytes: wrapBigInt(trafficLimitBytes),
                telegramId: wrapBigIntNullable(telegramId),
                lastTriggeredThreshold: trafficLimitBytes !== undefined ? 0 : undefined,
            });

            let isNeedToBeAddedToNode = false;
            let isNeedToBeRemovedFromNode = false;

            if (user.status !== 'ACTIVE' && status === 'ACTIVE') {
                isNeedToBeAddedToNode = true;
                newUserEntity.status = 'ACTIVE';
            }

            if (user.status === 'ACTIVE' && status === 'DISABLED') {
                isNeedToBeRemovedFromNode = true;
                newUserEntity.status = 'DISABLED';
            }

            if (trafficLimitBytes !== undefined) {
                if (user.status === 'LIMITED' && trafficLimitBytes >= 0) {
                    if (
                        BigInt(trafficLimitBytes) > user.trafficLimitBytes ||
                        trafficLimitBytes === 0
                    ) {
                        newUserEntity.status = 'ACTIVE';
                        isNeedToBeAddedToNode = true;
                    }
                }
            }

            if (user.status === 'EXPIRED' && dto.expireAt && !dto.status) {
                const now = dayjs.utc();
                const newExpireDate = dayjs.utc(dto.expireAt);
                const currentExpireDate = dayjs.utc(user.expireAt);

                if (!currentExpireDate.isSame(newExpireDate)) {
                    if (newExpireDate.isAfter(now)) {
                        newUserEntity.status = 'ACTIVE';
                        isNeedToBeAddedToNode = true;
                    }
                }
            }

            const result = await this.userRepository.update(newUserEntity);

            if (activeInternalSquads) {
                const newActiveInternalSquadsUuids = activeInternalSquads;

                const currentInternalSquadsUuids =
                    user.activeInternalSquads.map((squad) => squad.uuid) || [];

                const hasChanges =
                    newActiveInternalSquadsUuids.length !== currentInternalSquadsUuids.length ||
                    !newActiveInternalSquadsUuids.every((uuid) =>
                        currentInternalSquadsUuids.includes(uuid),
                    );

                if (hasChanges) {
                    await this.userRepository.removeUserFromInternalSquads(result.uuid);

                    if (newActiveInternalSquadsUuids.length === 0) {
                        isNeedToBeRemovedFromNode = true;
                    }

                    if (newActiveInternalSquadsUuids.length > 0) {
                        await this.userRepository.addUserToInternalSquads(
                            result.uuid,
                            newActiveInternalSquadsUuids,
                        );

                        isNeedToBeAddedToNode = true;
                    }
                }
            }

            const userWithInbounds = await this.userRepository.findUniqueByCriteria(
                { uuid: result.uuid },
                {
                    activeInternalSquads: true,
                    lastConnectedNode: true,
                },
            );

            if (!userWithInbounds) {
                throw new Error(ERRORS.CANT_GET_CREATED_USER_WITH_INBOUNDS.code);
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
            throw error;
        }
    }

    @Transactional()
    public async createUserTransactional(
        dto: CreateUserRequestDto,
    ): Promise<ICommandResponse<UserEntity>> {
        try {
            const {
                username,
                expireAt,
                trafficLimitBytes,
                trafficLimitStrategy,
                status,
                shortUuid,
                trojanPassword,
                vlessUuid,
                ssPassword,
                createdAt,
                lastTrafficResetAt,
                description,
                telegramId,
                email,
                hwidDeviceLimit,
                tag,
                activeInternalSquads,
                externalSquadUuid,
                uuid,
            } = dto;

            const userEntity = new BaseUserEntity({
                username,
                shortUuid: shortUuid || this.createNanoId(),
                trojanPassword: trojanPassword || this.createTrojanPassword(),
                vlessUuid: vlessUuid || this.createUuid(),
                ssPassword: ssPassword || this.createSSPassword(),
                status,
                trafficLimitBytes: wrapBigInt(trafficLimitBytes),
                trafficLimitStrategy,
                email: email,
                telegramId: wrapBigIntNullable(telegramId),
                expireAt: expireAt,
                createdAt: createdAt,
                lastTrafficResetAt: lastTrafficResetAt,
                description: description,
                hwidDeviceLimit: hwidDeviceLimit,
                tag: tag,
                uuid: uuid,
                externalSquadUuid: externalSquadUuid,
            });

            const result = await this.userRepository.create(userEntity);

            if (activeInternalSquads && activeInternalSquads.length > 0) {
                const squadsResult = await this.userRepository.addUserToInternalSquads(
                    result.uuid,
                    activeInternalSquads,
                );

                if (!squadsResult) {
                    return {
                        isOk: false,
                        ...ERRORS.CREATE_USER_WITH_INTERNAL_SQUAD_ERROR,
                    };
                }
            }

            const userWithInbounds = await this.userRepository.findUniqueByCriteria(
                {
                    uuid: result.uuid,
                },
                {
                    activeInternalSquads: true,
                    lastConnectedNode: true,
                },
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
            throw error;
        }
    }

    public async getAllUsers(dto: GetAllUsersCommand.RequestQuery): Promise<
        ICommandResponse<{
            total: number;
            users: UserEntity[];
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
    ): Promise<ICommandResponse<UserEntity>> {
        try {
            const result = await this.userRepository.findUniqueByCriteria({
                username: dto.username || undefined,
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

    public async getUsersByNonUniqueFields(
        dto: IGetUsersByTelegramIdOrEmail,
    ): Promise<ICommandResponse<UserEntity[]>> {
        try {
            const result = await this.userRepository.findByNonUniqueCriteria({
                email: dto.email || undefined,
                telegramId: dto.telegramId ? BigInt(dto.telegramId) : undefined,
                tag: dto.tag || undefined,
            });

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
        shortUuid?: string,
    ): Promise<ICommandResponse<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'vlessUuid'],
            );

            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const updateResult = await this.userRepository.revokeUserSubscription({
                uuid: user.uuid,
                shortUuid: shortUuid ?? this.createNanoId(),
                trojanPassword: this.createTrojanPassword(),
                vlessUuid: this.createUuid(),
                ssPassword: this.createTrojanPassword(),
                subRevokedAt: new Date(),
            });

            if (!updateResult) {
                return {
                    isOk: false,
                    ...ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR,
                };
            }

            const updatedUser = await this.userRepository.findUniqueByCriteria({ uuid: user.uuid });

            if (!updatedUser) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            if (updatedUser.status === USERS_STATUS.ACTIVE) {
                this.eventBus.publish(new AddUserToNodeEvent(updatedUser.uuid, user.vlessUuid));
            }

            this.eventEmitter.emit(
                EVENTS.USER.REVOKED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.REVOKED,
                }),
            );

            return {
                isOk: true,
                response: updatedUser,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR,
            };
        }
    }

    public async deleteUser(userUuid: string): Promise<ICommandResponse<DeleteUserResponseModel>> {
        try {
            const user = await this.userRepository.findUniqueByCriteria(
                { uuid: userUuid },
                {
                    activeInternalSquads: true,
                    lastConnectedNode: true,
                },
            );

            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const result = await this.userRepository.deleteByUUID(user.uuid);

            this.eventBus.publish(new RemoveUserFromNodeEvent(user.username, user.vlessUuid));

            this.eventEmitter.emit(
                EVENTS.USER.DELETED,
                new UserEvent({
                    user,
                    event: EVENTS.USER.DELETED,
                }),
            );
            return {
                isOk: true,
                response: new DeleteUserResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.DELETE_USER_ERROR };
        }
    }

    public async disableUser(userUuid: string): Promise<ICommandResponse<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'status'],
            );

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

            await this.userRepository.updateUserStatus(user.uuid, USERS_STATUS.DISABLED);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ uuid: user.uuid });

            if (!updatedUser) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            this.eventBus.publish(
                new RemoveUserFromNodeEvent(updatedUser.username, updatedUser.vlessUuid),
            );
            this.eventEmitter.emit(
                EVENTS.USER.DISABLED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.DISABLED,
                }),
            );

            return {
                isOk: true,
                response: updatedUser,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DISABLE_USER_ERROR,
            };
        }
    }

    public async enableUser(userUuid: string): Promise<ICommandResponse<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'status'],
            );

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

            await this.userRepository.updateUserStatus(user.uuid, USERS_STATUS.ACTIVE);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ uuid: user.uuid });

            if (!updatedUser) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            this.eventBus.publish(new AddUserToNodeEvent(user.uuid));

            this.eventEmitter.emit(
                EVENTS.USER.ENABLED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.ENABLED,
                }),
            );

            return {
                isOk: true,
                response: updatedUser,
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
    public async resetUserTraffic(userUuid: string): Promise<ICommandResponse<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'status', 'usedTrafficBytes'],
            );

            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            let status = undefined;
            if (user.status === USERS_STATUS.LIMITED) {
                status = USERS_STATUS.ACTIVE;
                this.eventBus.publish(new AddUserToNodeEvent(user.uuid));
            }

            await this.userRepository.updateStatusAndTrafficAndResetAt(
                user.uuid,
                new Date(),
                status,
            );

            await this.createUserUsageHistory({
                userTrafficHistory: new UserTrafficHistoryEntity({
                    userUuid: user.uuid,
                    resetAt: new Date(),
                    usedBytes: BigInt(user.usedTrafficBytes),
                }),
            });

            const newUser = await this.userRepository.findUniqueByCriteria(
                { uuid: userUuid },
                {
                    activeInternalSquads: true,
                    lastConnectedNode: true,
                },
            );

            if (!newUser) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            if (user.status === USERS_STATUS.LIMITED) {
                this.eventEmitter.emit(
                    EVENTS.USER.ENABLED,
                    new UserEvent({
                        user: newUser,
                        event: EVENTS.USER.ENABLED,
                    }),
                );
            }

            this.eventEmitter.emit(
                EVENTS.USER.TRAFFIC_RESET,
                new UserEvent({
                    user: newUser,
                    event: EVENTS.USER.TRAFFIC_RESET,
                }),
            );

            return {
                isOk: true,
                response: newUser,
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
            const affectedUsers = await this.userRepository.countByStatus(dto.status);

            await this.userActionsQueueService.bulkDeleteByStatus(dto.status);

            return {
                isOk: true,
                response: new BulkDeleteByStatusResponseModel(affectedUsers),
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

    public async bulkUpdateUsersInternalSquads(
        usersUuids: string[],
        internalSquadsUuids: string[],
    ): Promise<ICommandResponse<BulkOperationResponseModel>> {
        try {
            const usersLength = usersUuids.length;
            const batchLength = 3_000;

            for (let i = 0; i < usersLength; i += batchLength) {
                const batchUsersUuids = usersUuids.slice(i, i + batchLength);
                await this.userRepository.removeUsersFromInternalSquads(batchUsersUuids);
                await this.userRepository.addUsersToInternalSquads(
                    batchUsersUuids,
                    internalSquadsUuids,
                );
            }

            // TODO: finish later
            await this.startAllNodesQueue.startAllNodesWithoutDeduplication({
                emitter: 'bulkUpdateUsersInternalSquads',
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
                lastTriggeredThreshold: dto.trafficLimitBytes !== undefined ? 0 : undefined,
                trafficLimitBytes: wrapBigInt(dto.trafficLimitBytes),
                telegramId: wrapBigIntNullable(dto.telegramId),
                hwidDeviceLimit: dto.hwidDeviceLimit,
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

    public async getUserAccessibleNodes(
        userUuid: string,
    ): Promise<ICommandResponse<GetUserAccessibleNodesResponseModel>> {
        try {
            const result = await this.userRepository.getUserAccessibleNodes(userUuid);

            if (!result) {
                return {
                    isOk: true,
                    response: new GetUserAccessibleNodesResponseModel({
                        userUuid,
                        activeNodes: [],
                    }),
                };
            }

            return {
                isOk: true,
                response: new GetUserAccessibleNodesResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_USER_ACCESSIBLE_NODES_ERROR };
        }
    }

    public async getUserSubscriptionRequestHistory(
        userUuid: string,
    ): Promise<ICommandResponse<GetUserSubscriptionRequestHistoryResponseModel>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid'],
            );

            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const requestHistory = await this.queryBus.execute(
                new GetUserSubscriptionRequestHistoryQuery(user.uuid),
            );

            if (!requestHistory.isOk || !requestHistory.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR,
                };
            }

            return {
                isOk: true,
                response: new GetUserSubscriptionRequestHistoryResponseModel(
                    requestHistory.response.map((history) => ({
                        id: Number(history.id),
                        userUuid: history.userUuid,
                        requestAt: history.requestAt,
                        requestIp: history.requestIp,
                        userAgent: history.userAgent,
                    })),
                ),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR };
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

    private async createUserUsageHistory(
        dto: CreateUserTrafficHistoryCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<CreateUserTrafficHistoryCommand, ICommandResponse<void>>(
            new CreateUserTrafficHistoryCommand(dto.userTrafficHistory),
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
