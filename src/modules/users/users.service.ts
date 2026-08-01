import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { customAlphabet } from 'nanoid';
import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TypedConfigService } from '@common/config/app-config';
import { fail, ok, TResult } from '@common/types';
import { mapDefined, wrapBigInt, wrapBigIntNullable } from '@common/utils';
import { ERRORS, USERS_STATUS, EVENTS } from '@libs/contracts/constants';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { AddUserToNodeEvent } from '@modules/nodes/events/add-user-to-node';
import { AddUsersToNodeEvent } from '@modules/nodes/events/add-users-to-node';
import { RemoveUserFromNodeEvent } from '@modules/nodes/events/remove-user-from-node';
import { RemoveUsersFromNodeEvent } from '@modules/nodes/events/remove-users-from-node';
import { GetUserSubscriptionRequestHistoryQuery } from '@modules/user-subscription-request-history/queries/get-user-subscription-request-history';

import { UsersQueuesService } from '@queue/_users';

import {
    BulkAllUpdateUsersBodyDto,
    BulkDeleteUsersByStatusBodyDto,
    BulkUpdateUsersBodyDto,
    CreateUserBodyDto,
    GetUsersQueryDto,
    GetUsersStreamQueryDto,
    ResolveUserBodyDto,
    RevokeUserSubscriptionBodyDto,
    UpdateUserBodyDto,
} from './dtos';
import { BaseUserEntity, UserEntity } from './entities';
import { IGetUserByUnique, IUpdateUserDto } from './interfaces';
import {
    GetUserAccessibleNodesResponseModel,
    GetUserSubscriptionRequestHistoryResponseModel,
    ResolveUserResponseModel,
} from './models';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private readonly shortUuidLength: number;

    constructor(
        private readonly userRepository: UsersRepository,
        private readonly eventBus: EventBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly queryBus: QueryBus,
        private readonly configService: TypedConfigService,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        this.shortUuidLength = this.configService.getOrThrow('SHORT_UUID_LENGTH');
    }

    public async createUser(dto: CreateUserBodyDto): Promise<TResult<UserEntity>> {
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
                externalSquadUuid: dto.externalSquadUuid,
            });

            const { id } = await this.userRepository.create(userEntity, dto.activeInternalSquads);

            const result = await this.getUserByUniqueFields({ id });

            if (!result.isOk) return fail(ERRORS.CREATE_USER_ERROR);

            const { response: user } = result;

            if (user.status === USERS_STATUS.ACTIVE) {
                this.eventBus.publish(new AddUserToNodeEvent(user.id));
            }

            this.eventEmitter.emit(
                EVENTS.USER.CREATED,
                new UserEvent({
                    user: user,
                    event: EVENTS.USER.CREATED,
                }),
            );

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

    public async updateUser(dto: UpdateUserBodyDto): Promise<TResult<UserEntity>> {
        try {
            const {
                username,
                id,
                trafficLimitBytes,
                telegramId,
                activeInternalSquads: newActiveInternalSquadsUuids,
                status,
                ...rest
            } = dto;

            const user = await this.userRepository.findUniqueByCriteria(
                {
                    username,
                    id: wrapBigInt(id),
                },
                {
                    activeInternalSquads: true,
                },
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const newUserEntity = new BaseUserEntity({
                ...rest,
                id: user.id,
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
                this.eventBus.publish(new AddUserToNodeEvent(updatedUser.id));
            }

            if (removeFromNode) {
                this.eventBus.publish(
                    new RemoveUserFromNodeEvent(updatedUser.id, updatedUser.vlessUuid),
                );
            }

            this.eventEmitter.emit(
                EVENTS.USER.MODIFIED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.MODIFIED,
                }),
            );

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);

            return fail(ERRORS.UPDATE_USER_ERROR);
        }
    }

    public async getAllUsers(dto: GetUsersQueryDto): Promise<
        TResult<{
            total: number;
            users: UserEntity[];
        }>
    > {
        try {
            const [users, total] = await this.userRepository.getAllUsers(dto);

            return ok({ users, total });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_USERS_ERROR);
        }
    }

    public async getUsersStream(dto: GetUsersStreamQueryDto): Promise<
        TResult<{
            users: UserEntity[];
            nextCursor: string | null;
            hasMore: boolean;
        }>
    > {
        try {
            const result = await this.userRepository.getUsersStream(dto);

            return ok(result);
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
                id: dto.id || undefined,
            });

            if (!result) return fail(ERRORS.GET_USER_BY_UNIQUE_FIELDS_NOT_FOUND);

            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_BY_ERROR);
        }
    }

    public async revokeUserSubscription(
        userId: number,
        dto?: RevokeUserSubscriptionBodyDto,
    ): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id', 'vlessUuid', 'shortUuid'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            let shortUuid = user.shortUuid;

            if (!dto) {
                shortUuid = this.createNanoId();
            } else if (!dto.revokeOnlyPasswords) {
                shortUuid = dto.shortUuid ?? this.createNanoId();
            }

            const updateResult = await this.userRepository.revokeUserSubscription({
                id: user.id,
                shortUuid,
                trojanPassword: this.createPassword(),
                vlessUuid: this.createUuid(),
                ssPassword: this.createPassword(),
                subRevokedAt: new Date(),
                updatedAt: new Date(),
            });

            if (!updateResult) return fail(ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ id: user.id });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

            if (updatedUser.status === USERS_STATUS.ACTIVE) {
                this.eventBus.publish(new AddUserToNodeEvent(updatedUser.id, user.vlessUuid));
            }

            this.eventEmitter.emit(
                EVENTS.USER.REVOKED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.REVOKED,
                }),
            );

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REVOKE_USER_SUBSCRIPTION_ERROR);
        }
    }

    public async deleteUser(userId: number): Promise<TResult<boolean>> {
        try {
            const user = await this.userRepository.findUniqueByCriteria(
                { id: BigInt(userId) },
                {
                    activeInternalSquads: true,
                },
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            await this.userRepository.deleteById(user.id);

            this.eventBus.publish(new RemoveUserFromNodeEvent(user.id, user.vlessUuid));

            this.eventEmitter.emit(
                EVENTS.USER.DELETED,
                new UserEvent({
                    user,
                    event: EVENTS.USER.DELETED,
                }),
            );
            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_USER_ERROR);
        }
    }

    public async disableUser(userId: number): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id', 'status'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            if (user.status === USERS_STATUS.DISABLED) {
                return fail(ERRORS.USER_ALREADY_DISABLED);
            }

            await this.userRepository.updateUserStatus(user.id, USERS_STATUS.DISABLED);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ id: user.id });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

            this.eventBus.publish(
                new RemoveUserFromNodeEvent(updatedUser.id, updatedUser.vlessUuid),
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

    public async enableUser(userId: number): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id', 'status'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            if (user.status === USERS_STATUS.ACTIVE) {
                return fail(ERRORS.USER_ALREADY_ENABLED);
            }

            await this.userRepository.updateUserStatus(user.id, USERS_STATUS.ACTIVE);

            const updatedUser = await this.userRepository.findUniqueByCriteria({ id: user.id });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

            this.eventBus.publish(new AddUserToNodeEvent(user.id));

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

    public async extendUserExpirationDate(
        userId: number,
        days: number,
    ): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id', 'status', 'expireAt'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const now = dayjs.utc();
            const currentExpire = dayjs.utc(user.expireAt);
            const base = currentExpire.isAfter(now) ? currentExpire : now;
            const newExpireDate = base.add(days, 'day').toDate();

            const newStatus =
                user.status === USERS_STATUS.EXPIRED ? USERS_STATUS.ACTIVE : user.status;

            await this.userRepository.update({
                id: user.id,
                expireAt: newExpireDate,
                status: newStatus,
            });

            const updatedUser = await this.userRepository.findUniqueByCriteria({ id: user.id });

            if (!updatedUser) return fail(ERRORS.USER_NOT_FOUND);

            if (user.status === USERS_STATUS.EXPIRED && newStatus === USERS_STATUS.ACTIVE) {
                this.eventBus.publish(new AddUserToNodeEvent(user.id));
            }

            this.eventEmitter.emit(
                EVENTS.USER.MODIFIED,
                new UserEvent({
                    user: updatedUser,
                    event: EVENTS.USER.MODIFIED,
                }),
            );

            return ok(updatedUser);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_USER_ERROR);
        }
    }

    public async resetUserTraffic(userId: number): Promise<TResult<UserEntity>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id', 'status'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            let status = undefined;
            if (user.status === USERS_STATUS.LIMITED) {
                status = USERS_STATUS.ACTIVE;
                this.eventBus.publish(new AddUserToNodeEvent(user.id));
            }

            await this.userRepository.updateStatusAndTrafficAndResetAt(user.id, new Date(), status);

            const newUser = await this.userRepository.findUniqueByCriteria(
                { id: user.id },
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
        dto: BulkDeleteUsersByStatusBodyDto,
    ): Promise<TResult<boolean>> {
        try {
            await this.usersQueuesService.bulkDeleteByStatus(dto.status);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_DELETE_USERS_BY_STATUS_ERROR);
        }
    }

    public async bulkDeleteUsersByUserId(userIds: number[]): Promise<TResult<boolean>> {
        try {
            if (userIds.length === 0) {
                return ok(true);
            }

            const users = await this.userRepository.getUsersByUserIds(userIds);

            await this.userRepository.deleteManyByUserIds(users.map((user) => user.id));

            await this.eventBus.publish(
                new RemoveUsersFromNodeEvent(
                    users.map((user) => ({ id: user.id, vlessUuid: user.vlessUuid })),
                ),
            );

            for (const user of users) {
                this.eventEmitter.emit(
                    EVENTS.USER.DELETED,
                    new UserEvent({
                        user,
                        event: EVENTS.USER.DELETED,
                    }),
                );
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_DELETE_USERS_BY_USER_IDS_ERROR);
        }
    }

    public async bulkRevokeUsersSubscription(userIds: number[]): Promise<TResult<boolean>> {
        try {
            // handled one by one
            await this.usersQueuesService.revokeUsersSubscriptionBulk(userIds);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_REVOKE_USERS_SUBSCRIPTION_ERROR);
        }
    }

    public async bulkResetUserTraffic(userIds: number[]): Promise<TResult<boolean>> {
        try {
            // handled one by one
            await this.usersQueuesService.resetUserTrafficBulk(userIds);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_RESET_USER_TRAFFIC_ERROR);
        }
    }

    public async bulkUpdateUsers(dto: BulkUpdateUsersBodyDto): Promise<TResult<boolean>> {
        try {
            if (
                dto.fields.status === USERS_STATUS.EXPIRED ||
                dto.fields.status === USERS_STATUS.LIMITED
            ) {
                return fail(ERRORS.INVALID_USER_STATUS_ERROR);
            }

            // handled one by one
            await this.usersQueuesService.updateUsersBulk({
                userIds: dto.userIds,
                fields: dto.fields,
            });

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_UPDATE_USERS_ERROR);
        }
    }

    public async bulkUpdateUsersInternalSquads(
        userIds: number[],
        internalSquadsUuids: string[],
    ): Promise<TResult<boolean>> {
        try {
            const validatedUserIds = await this.userRepository.validateUserIds(userIds);

            await this.userRepository.removeUsersFromInternalSquads(validatedUserIds);

            await this.userRepository.addUsersToInternalSquads(
                validatedUserIds,
                internalSquadsUuids,
            );

            await this.eventBus.publish(new AddUsersToNodeEvent(validatedUserIds));

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_ADD_INBOUNDS_TO_USERS_ERROR);
        }
    }

    public async bulkUpdateAllUsers(dto: BulkAllUpdateUsersBodyDto): Promise<TResult<boolean>> {
        try {
            if (dto.status === USERS_STATUS.EXPIRED || dto.status === USERS_STATUS.LIMITED) {
                return fail(ERRORS.INVALID_USER_STATUS_ERROR);
            }

            await this.usersQueuesService.bulkUpdateAllUsers(dto);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_UPDATE_ALL_USERS_ERROR);
        }
    }

    public async bulkAllResetUserTraffic(): Promise<TResult<boolean>> {
        try {
            await this.usersQueuesService.resetAllUserTraffic();

            return ok(true);
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
        userId: number,
    ): Promise<TResult<GetUserAccessibleNodesResponseModel>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const result = await this.userRepository.getUserAccessibleNodes(user.id);

            return ok(new GetUserAccessibleNodesResponseModel(result, user.id));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_ACCESSIBLE_NODES_ERROR);
        }
    }

    public async getUserSubscriptionRequestHistory(
        userId: number,
    ): Promise<TResult<GetUserSubscriptionRequestHistoryResponseModel>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                { id: BigInt(userId) },
                ['id'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            const requestHistory = await this.queryBus.execute(
                new GetUserSubscriptionRequestHistoryQuery(user.id),
            );

            if (!requestHistory.isOk) {
                return fail(ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR);
            }

            return ok(
                new GetUserSubscriptionRequestHistoryResponseModel(
                    requestHistory.response.map((history) => ({
                        id: Number(history.id),
                        userId: Number(history.userId),
                        requestAt: history.requestAt,
                        requestIp: history.requestIp,
                        userAgent: history.userAgent,
                        srrRuleName: history.srrRuleName,
                        srrResponseType: history.srrResponseType,
                    })),
                ),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR);
        }
    }

    public async bulkExtendExpirationDate(dto: {
        userIds: number[];
        extendDays: number;
    }): Promise<TResult<boolean>> {
        try {
            const affectedRows = await this.userRepository.bulkExtendExpirationDateByUserIds(
                dto.userIds,
                dto.extendDays,
            );

            if (affectedRows === 0) {
                return ok(true);
            }

            const userIds = await this.userRepository.bulkSyncExpiredUsersByUserIds(dto.userIds);

            for (const userId of userIds) {
                this.eventBus.publish(new AddUserToNodeEvent(userId));
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_EXTEND_EXPIRATION_DATE_ERROR);
        }
    }

    public async bulkAllExtendExpirationDate(extendDays: number): Promise<TResult<boolean>> {
        try {
            await this.usersQueuesService.bulkAllExtendExpirationDate(extendDays);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BULK_EXTEND_EXPIRATION_DATE_ERROR);
        }
    }

    public async resolveUser(dto: ResolveUserBodyDto): Promise<TResult<ResolveUserResponseModel>> {
        try {
            const user = await this.userRepository.getPartialUserByUniqueFields(
                {
                    id: mapDefined(dto.id, (id) => wrapBigInt(id)),
                    shortUuid: dto.shortUuid,
                    username: dto.username,
                },
                ['id', 'shortUuid', 'username'],
            );

            if (!user) return fail(ERRORS.USER_NOT_FOUND);

            return ok(
                new ResolveUserResponseModel({
                    id: Number(user.id),
                    shortUuid: user.shortUuid,
                    username: user.username,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
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
}
