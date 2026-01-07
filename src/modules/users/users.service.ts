import type { Cache } from 'cache-manager';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import dayjs from 'dayjs';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { wrapBigInt, wrapBigIntNullable } from '@common/utils';
import { fail, ok, TResult } from '@common/types';
import { ERRORS, USERS_STATUS, EVENTS, CACHE_KEYS } from '@libs/contracts/constants';
import { GetAllUsersCommand } from '@libs/contracts/commands';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { GetUserSubscriptionRequestHistoryQuery } from '@modules/user-subscription-request-history/queries/get-user-subscription-request-history';
import { RemoveUsersFromNodeEvent } from '@modules/nodes/events/remove-users-from-node';
import { RemoveUserFromNodeEvent } from '@modules/nodes/events/remove-user-from-node';
import { AddUsersToNodeEvent } from '@modules/nodes/events/add-users-to-node';
import { AddUserToNodeEvent } from '@modules/nodes/events/add-user-to-node';

import { NodesQueuesService } from '@queue/_nodes';
import { UsersQueuesService } from '@queue/_users';

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
    RevokeUserSubscriptionBodyDto,
} from './dtos';
import { IGetUserByUnique, IGetUsersByTelegramIdOrEmail, IUpdateUserDto } from './interfaces';
import { GetCachedShortUuidRangeQuery } from './queries/get-cached-short-uuid-range';
import { UsersRepository } from './repositories/users.repository';
import { BaseUserEntity, UserEntity } from './entities';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private readonly shortUuidLength: number;

    constructor(
        private readonly userRepository: UsersRepository,
        private readonly eventBus: EventBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly queryBus: QueryBus,
        private readonly configService: ConfigService,
        private readonly usersQueuesService: UsersQueuesService,
        private readonly nodesQueuesService: NodesQueuesService,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.shortUuidLength = this.configService.getOrThrow<number>('SHORT_UUID_LENGTH');
    }

    public async createUser(dto: CreateUserRequestDto): Promise<TResult<UserEntity>> {
        try {
            const userEntity = new BaseUserEntity({
                username: dto.username,
                shortUuid: dto.shortUuid || this.createNanoId(),
                trojanPassword: dto.trojanPassword || this.createPassword(),
                vlessUuid: dto.vlessUuid || this.createUuid(),
                ssPassword: dto.ssPassword || this.createPassword(),
                status: dto.status,
                trafficLimitBytes: wrapBigInt(dto.trafficLimitBytes),
                trafficLimitStrategy: dto.trafficLimitStrategy,
                email: dto.email,
                telegramId: wrapBigIntNullable(dto.telegramId),
                expireAt: dto.expireAt,
                createdAt: dto.createdAt,
                lastTrafficResetAt: dto.lastTrafficResetAt,
                description: dto.description,
                hwidDeviceLimit: dto.hwidDeviceLimit,
                tag: dto.tag,
                uuid: dto.uuid,
                externalSquadUuid: dto.externalSquadUuid,
            });

            const { tId } = await this.userRepository.create(userEntity, dto.activeInternalSquads);

            const result = await this.getUserByUniqueFields({ tId });

            if (!result.isOk) return fail(ERRORS.CREATE_USER_ERROR);

            const { response: user } = result;

            if (user.status === USERS_STATUS.ACTIVE) {
                this.eventBus.publish(new AddUserToNodeEvent(user.uuid));
            }

            this.eventEmitter.emit(
                EVENTS.USER.CREATED,
                new UserEvent({
                    user: user,
                    event: EVENTS.USER.CREATED,
                }),
            );

            await this.invalidateShortUuidRangeCache(user.shortUuid);

            return ok(user);
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
                    return fail(ERRORS.USER_USERNAME_ALREADY_EXISTS);
                }
                if (fields.includes('shortUuid') || fields.includes('short_uuid')) {
                    return fail(ERRORS.USER_SHORT_UUID_ALREADY_EXISTS);
                }
                if (fields.includes('subscriptionUuid') || fields.includes('subscription_uuid')) {
                    return fail(ERRORS.USER_SUBSCRIPTION_UUID_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.CREATE_USER_ERROR);
        }
    }

    public async updateUser(dto: UpdateUserRequestDto): Promise<TResult<UserEntity>> {
        try {
            const {
                username,
                uuid,
                trafficLimitBytes,
                telegramId,
                activeInternalSquads: newActiveInternalSquadsUuids,
                status,
                ...rest
            } = dto;

            const userCriteria = uuid ? { uuid } : { username };

            const user = await this.userRepository.findUniqueByCriteria(userCriteria, {
                activeInternalSquads: true,
            });

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const newUserEntity = new BaseUserEntity({
                ...rest,
                tId: user.tId,
                trafficLimitBytes: wrapBigInt(trafficLimitBytes),
                telegramId: wrapBigIntNullable(telegramId),
                lastTriggeredThreshold: trafficLimitBytes !== undefined ? 0 : undefined,
            });

            let addToNode = false;
            let removeFromNode = false;

            if (user.status !== 'ACTIVE' && status === 'ACTIVE') {
                addToNode = true;
                newUserEntity.status = 'ACTIVE';
            }

            if (user.status === 'ACTIVE' && status === 'DISABLED') {
                removeFromNode = true;
                newUserEntity.status = 'DISABLED';
            }

            if (trafficLimitBytes !== undefined) {
                if (user.status === 'LIMITED' && trafficLimitBytes >= 0) {
                    if (
                        BigInt(trafficLimitBytes) > user.trafficLimitBytes ||
                        trafficLimitBytes === 0
                    ) {
                        newUserEntity.status = 'ACTIVE';
                        addToNode = true;
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
                        addToNode = true;
                    }
                }
            }

            const updateDto: IUpdateUserDto = {
                ...newUserEntity,
            };

            if (newActiveInternalSquadsUuids) {
                const currentInternalSquadsUuids = user.activeInternalSquads.map(
                    (squad) => squad.uuid,
                );

                const hasChanges =
                    newActiveInternalSquadsUuids.length !== currentInternalSquadsUuids.length ||
                    !newActiveInternalSquadsUuids.every((uuid) =>
                        currentInternalSquadsUuids.includes(uuid),
                    );

                if (hasChanges) {
                    updateDto.activeInternalSquads = newActiveInternalSquadsUuids;
                    removeFromNode = newActiveInternalSquadsUuids.length === 0;
                    addToNode = newActiveInternalSquadsUuids.length > 0;
                }
            }

            const updatedUser = await this.userRepository.update(updateDto);

            if (!updatedUser) {
                return fail(ERRORS.UPDATE_USER_ERROR);
            }

            if (updatedUser.status === USERS_STATUS.ACTIVE && addToNode && !removeFromNode) {
                this.eventBus.publish(new AddUserToNodeEvent(updatedUser.uuid));
            }

            if (removeFromNode) {
                this.eventBus.publish(
                    new RemoveUserFromNodeEvent(updatedUser.tId, updatedUser.vlessUuid),
                );
            }

            this.eventEmitter.emit(
                EVENTS.USER.MODIFIED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.MODIFIED,
                }),
            );

            await this.invalidateShortUuidRangeCache(updatedUser.shortUuid);

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);

            return fail(ERRORS.UPDATE_USER_ERROR);
        }
    }

    public async getAllUsers(dto: GetAllUsersCommand.RequestQuery): Promise<
        TResult<{
            total: number;
            users: UserEntity[];
        }>
    > {
        try {
            const [users, total] = await this.userRepository.getAllUsersV2(dto);

            return ok({ users, total });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_USERS_ERROR);
        }
    }

    public async getUserByUniqueFields(dto: IGetUserByUnique): Promise<TResult<UserEntity>> {
        try {
            const result = await this.userRepository.findUniqueByCriteria({
                username: dto.username || undefined,
                shortUuid: dto.shortUuid || undefined,
                uuid: dto.uuid || undefined,
                tId: dto.tId || undefined,
            });

            if (!result) return fail(ERRORS.GET_USER_BY_UNIQUE_FIELDS_NOT_FOUND);

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_BY_ERROR);
        }
    }

    public async getUsersByNonUniqueFields(
        dto: IGetUsersByTelegramIdOrEmail,
    ): Promise<TResult<UserEntity[]>> {
        try {
            const result = await this.userRepository.findByNonUniqueCriteria({
                email: dto.email || undefined,
                telegramId: dto.telegramId ? BigInt(dto.telegramId) : undefined,
                tag: dto.tag || undefined,
            });

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_BY_ERROR);
        }
    }

    public async revokeUserSubscription(
        userUuid: string,
        dto?: RevokeUserSubscriptionBodyDto,
    ): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'vlessUuid', 'shortUuid'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            let shortUuid = user.shortUuid;

            if (dto && !dto.revokeOnlyPasswords) {
                shortUuid = dto.shortUuid ?? this.createNanoId();
            }

            const updateResult = await this.userRepository.revokeUserSubscription({
                uuid: user.uuid,
                shortUuid,
                trojanPassword: this.createPassword(),
                vlessUuid: this.createUuid(),
                ssPassword: this.createPassword(),
                subRevokedAt: new Date(),
                subLastOpenedAt: null,
                subLastUserAgent: null,
            });

            if (!updateResult) return fail(ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ uuid: user.uuid });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

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

            await this.invalidateShortUuidRangeCache(updatedUser.shortUuid);

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR);
        }
    }

    public async deleteUser(userUuid: string): Promise<TResult<DeleteUserResponseModel>> {
        try {
            const user = await this.userRepository.findUniqueByCriteria(
                { uuid: userUuid },
                {
                    activeInternalSquads: true,
                },
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const result = await this.userRepository.deleteByUUID(user.uuid);

            this.eventBus.publish(new RemoveUserFromNodeEvent(user.tId, user.vlessUuid));

            this.eventEmitter.emit(
                EVENTS.USER.DELETED,
                new UserEvent({
                    user,
                    event: EVENTS.USER.DELETED,
                }),
            );
            return ok(new DeleteUserResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_USER_ERROR);
        }
    }

    public async disableUser(userUuid: string): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'status'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            if (user.status === USERS_STATUS.DISABLED) {
                return fail(ERRORS.USER_ALREADY_DISABLED);
            }

            await this.userRepository.updateUserStatus(user.uuid, USERS_STATUS.DISABLED);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ uuid: user.uuid });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

            this.eventBus.publish(
                new RemoveUserFromNodeEvent(updatedUser.tId, updatedUser.vlessUuid),
            );
            this.eventEmitter.emit(
                EVENTS.USER.DISABLED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.DISABLED,
                }),
            );

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DISABLE_USER_ERROR);
        }
    }

    public async enableUser(userUuid: string): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'status'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            if (user.status === USERS_STATUS.ACTIVE) {
                return fail(ERRORS.USER_ALREADY_ENABLED);
            }

            await this.userRepository.updateUserStatus(user.uuid, USERS_STATUS.ACTIVE);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ uuid: user.uuid });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

            this.eventBus.publish(new AddUserToNodeEvent(user.uuid));

            this.eventEmitter.emit(
                EVENTS.USER.ENABLED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.ENABLED,
                }),
            );

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ENABLE_USER_ERROR);
        }
    }

    public async resetUserTraffic(userUuid: string): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid', 'status', 'tId'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

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

            const newUser = await this.userRepository.findUniqueByCriteria(
                { uuid: userUuid },
                {
                    activeInternalSquads: true,
                },
            );

            if (!newUser) return fail(ERRORS.USER_NOT_FOUND);

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

            return ok(newUser);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.RESET_USER_TRAFFIC_ERROR);
        }
    }

    public async bulkDeleteUsersByStatus(
        dto: BulkDeleteUsersByStatusRequestDto,
    ): Promise<TResult<BulkDeleteByStatusResponseModel>> {
        try {
            const affectedUsers = await this.userRepository.countByStatus(dto.status);

            await this.usersQueuesService.bulkDeleteByStatus(dto.status);

            return ok(new BulkDeleteByStatusResponseModel(affectedUsers));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_DELETE_USERS_BY_STATUS_ERROR);
        }
    }

    public async bulkDeleteUsersByUuid(
        uuids: string[],
    ): Promise<TResult<BulkDeleteByStatusResponseModel>> {
        try {
            if (uuids.length === 0) {
                return ok(new BulkOperationResponseModel(0));
            }

            const usersIdsAndHashes = await this.userRepository.getIdsAndHashesByUserUuids(uuids);

            const result = await this.userRepository.deleteManyByUuid(uuids);

            await this.eventBus.publish(new RemoveUsersFromNodeEvent(usersIdsAndHashes));

            return ok(new BulkOperationResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_DELETE_USERS_BY_UUID_ERROR);
        }
    }

    public async bulkRevokeUsersSubscription(
        uuids: string[],
    ): Promise<TResult<BulkOperationResponseModel>> {
        try {
            // handled one by one
            await this.usersQueuesService.revokeUsersSubscriptionBulk(uuids);

            return ok(new BulkOperationResponseModel(uuids.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_REVOKE_USERS_SUBSCRIPTION_ERROR);
        }
    }

    public async bulkResetUserTraffic(
        uuids: string[],
    ): Promise<TResult<BulkOperationResponseModel>> {
        try {
            // handled one by one
            await this.usersQueuesService.resetUserTrafficBulk(uuids);

            return ok(new BulkOperationResponseModel(uuids.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_RESET_USER_TRAFFIC_ERROR);
        }
    }

    public async bulkUpdateUsers(
        dto: BulkUpdateUsersRequestDto,
    ): Promise<TResult<BulkOperationResponseModel>> {
        try {
            if (
                dto.fields.status === USERS_STATUS.EXPIRED ||
                dto.fields.status === USERS_STATUS.LIMITED
            ) {
                return fail(ERRORS.INVALID_USER_STATUS_ERROR);
            }

            // handled one by one
            await this.usersQueuesService.updateUsersBulk({
                uuids: dto.uuids,
                fields: dto.fields,
            });

            return ok(new BulkOperationResponseModel(dto.uuids.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_UPDATE_USERS_ERROR);
        }
    }

    public async bulkUpdateUsersInternalSquads(
        usersUuids: string[],
        internalSquadsUuids: string[],
    ): Promise<TResult<BulkOperationResponseModel>> {
        try {
            const userIds = await this.userRepository.getUserIdsByUuids(usersUuids);

            await this.userRepository.removeUsersFromInternalSquads(userIds);

            await this.userRepository.addUsersToInternalSquads(userIds, internalSquadsUuids);

            await this.eventBus.publish(new AddUsersToNodeEvent(userIds));

            return ok(new BulkOperationResponseModel(userIds.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_ADD_INBOUNDS_TO_USERS_ERROR);
        }
    }

    public async bulkUpdateAllUsers(
        dto: BulkAllUpdateUsersRequestDto,
    ): Promise<TResult<BulkAllResponseModel>> {
        try {
            if (dto.status === USERS_STATUS.EXPIRED || dto.status === USERS_STATUS.LIMITED) {
                return fail(ERRORS.INVALID_USER_STATUS_ERROR);
            }

            await this.usersQueuesService.bulkUpdateAllUsers(dto);

            return ok(new BulkAllResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_UPDATE_ALL_USERS_ERROR);
        }
    }

    public async bulkAllResetUserTraffic(): Promise<TResult<BulkAllResponseModel>> {
        try {
            await this.usersQueuesService.resetAllUserTraffic();

            return ok(new BulkAllResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_RESET_USER_TRAFFIC_ERROR);
        }
    }

    public async getAllTags(): Promise<TResult<string[]>> {
        try {
            const result = await this.userRepository.getAllTags();

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_TAGS_ERROR);
        }
    }

    public async getUserAccessibleNodes(
        userUuid: string,
    ): Promise<TResult<GetUserAccessibleNodesResponseModel>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['tId'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const result = await this.userRepository.getUserAccessibleNodes(user.tId);

            return ok(new GetUserAccessibleNodesResponseModel(result, userUuid));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_ACCESSIBLE_NODES_ERROR);
        }
    }

    public async getUserSubscriptionRequestHistory(
        userUuid: string,
    ): Promise<TResult<GetUserSubscriptionRequestHistoryResponseModel>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { uuid: userUuid },
                ['uuid'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const requestHistory = await this.queryBus.execute(
                new GetUserSubscriptionRequestHistoryQuery(user.uuid),
            );

            if (!requestHistory.isOk) {
                return fail(ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR);
            }

            return ok(
                new GetUserSubscriptionRequestHistoryResponseModel(
                    requestHistory.response.map((history) => ({
                        id: Number(history.id),
                        userUuid: history.userUuid,
                        requestAt: history.requestAt,
                        requestIp: history.requestIp,
                        userAgent: history.userAgent,
                    })),
                ),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR);
        }
    }

    public async bulkExtendExpirationDate(dto: {
        uuids: string[];
        extendDays: number;
    }): Promise<TResult<BulkOperationResponseModel>> {
        try {
            const affectedRows = await this.userRepository.bulkExtendExpirationDateByUuids(
                dto.uuids,
                dto.extendDays,
            );

            if (affectedRows === 0) {
                return ok(new BulkOperationResponseModel(0));
            }

            const uuids = await this.userRepository.bulkSyncExpiredUsersByUuids(dto.uuids);

            for (const uuid of uuids) {
                this.eventBus.publish(new AddUserToNodeEvent(uuid));
            }

            return ok(new BulkOperationResponseModel(affectedRows));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_EXTEND_EXPIRATION_DATE_ERROR);
        }
    }

    public async bulkAllExtendExpirationDate(
        extendDays: number,
    ): Promise<TResult<BulkAllResponseModel>> {
        try {
            await this.usersQueuesService.bulkAllExtendExpirationDate(extendDays);

            return ok(new BulkAllResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_EXTEND_EXPIRATION_DATE_ERROR);
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

    private createPassword(length: number = 32): string {
        const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghjkmnopqrstuvwxyz-';
        const nanoid = customAlphabet(alphabet, length);

        return nanoid();
    }

    private async invalidateShortUuidRangeCache(shortUuid: string): Promise<void> {
        try {
            const { min, max } = await this.queryBus.execute(new GetCachedShortUuidRangeQuery());

            if (shortUuid.length < min || shortUuid.length > max) {
                await this.cacheManager.del(CACHE_KEYS.SHORT_UUID_RANGE);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }
}
