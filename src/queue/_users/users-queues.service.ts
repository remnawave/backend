import { Queue } from 'bullmq';
import { chunk } from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { md5 } from '@common/utils';
import { TUsersStatus } from '@libs/contracts/constants';

import { BulkAllUpdateUsersRequestDto, BulkUpdateUsersRequestDto } from '@modules/users/dtos';

import { QUEUES_NAMES } from '@queue/queue.enum';

import {
    IAddUserSubscriptionRequestHistoryPayload,
    ICheckAndUpsertHwidDevicePayload,
    IFireUserEventJobData,
    IFireUserEventPayload,
    IUpdateUserSubPayload,
} from './interfaces';
import { USERS_JOB_NAMES } from './constants/users-job-name.constant';

@Injectable()
export class UsersQueuesService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(UsersQueuesService.name);

    constructor(
        @InjectQueue(QUEUES_NAMES.USERS.MODIFY_MANY) private readonly modifyManyUsersQueue: Queue,
        @InjectQueue(QUEUES_NAMES.USERS.SERIAL_OPERATIONS)
        private readonly serialUsersOperationsQueue: Queue,
        @InjectQueue(QUEUES_NAMES.USERS.SUBSCRIPTION_REQUESTS)
        private readonly subscriptionRequestsQueue: Queue,
        @InjectQueue(QUEUES_NAMES.USERS.RESET_USER_TRAFFIC)
        private readonly resetUserTrafficQueue: Queue,
        @InjectQueue(QUEUES_NAMES.USERS.USERS_WATCHDOG)
        private readonly usersWatchdogQueue: Queue,
        @InjectQueue(QUEUES_NAMES.USERS.USER_EVENTS)
        private readonly userEventsQueue: Queue,
        @InjectQueue(QUEUES_NAMES.USERS.UPDATE_USERS_USAGE)
        private readonly updateUsersUsageQueue: Queue,
    ) {}

    get queues() {
        return {
            modifyManyUsers: this.modifyManyUsersQueue,
            serialUsersOperations: this.serialUsersOperationsQueue,
            subscriptionRequests: this.subscriptionRequestsQueue,
            resetUserTraffic: this.resetUserTrafficQueue,
            usersWatchdog: this.usersWatchdogQueue,
            userEvents: this.userEventsQueue,
            updateUsersUsage: this.updateUsersUsageQueue,
        } as const;
    }

    async onApplicationBootstrap(): Promise<void> {
        for (const queue of Object.values(this.queues)) {
            const client = await queue.client;
            if (client.status !== 'ready') {
                throw new Error(`Queue "${queue.name}" not connected: ${client.status}.`);
            }
        }

        this.logger.log(`${Object.values(this.queues).length} queues are connected.`);

        await this.serialUsersOperationsQueue.setGlobalConcurrency(1);
        await this.resetUserTrafficQueue.setGlobalConcurrency(2);
        await this.usersWatchdogQueue.setGlobalConcurrency(2);

        await this.updateUsersUsageQueue.setGlobalConcurrency(5); // TODO: carefully
    }

    public async resetUsersTraffic(payload: Record<string, string>) {
        return this.modifyManyUsersQueue.add(USERS_JOB_NAMES.RESET_MANY_USERS_TRAFFIC, payload);
    }

    public async revokeUsersSubscription(payload: Record<string, string>) {
        return this.modifyManyUsersQueue.add(
            USERS_JOB_NAMES.REVOKE_MANY_USERS_SUBSCRIPTION,
            payload,
        );
    }

    public async resetUserTrafficBulk(uuids: string[]) {
        return this.modifyManyUsersQueue.addBulk(
            uuids.map((uuid) => ({
                name: USERS_JOB_NAMES.RESET_MANY_USERS_TRAFFIC,
                data: { uuid },
            })),
        );
    }

    public async revokeUsersSubscriptionBulk(uuids: string[]) {
        return this.modifyManyUsersQueue.addBulk(
            uuids.map((uuid) => ({
                name: USERS_JOB_NAMES.REVOKE_MANY_USERS_SUBSCRIPTION,
                data: { uuid },
            })),
        );
    }

    public async updateUsersBulk(dto: BulkUpdateUsersRequestDto) {
        return this.modifyManyUsersQueue.addBulk(
            dto.uuids.map((uuid) => ({
                name: USERS_JOB_NAMES.UPDATE_MANY_USERS,
                data: {
                    uuid,
                    fields: {
                        ...dto.fields,
                        trafficLimitBytes:
                            dto.fields.trafficLimitBytes !== undefined
                                ? dto.fields.trafficLimitBytes.toString()
                                : undefined,
                        telegramId:
                            dto.fields.telegramId !== undefined
                                ? dto.fields.telegramId === null
                                    ? null
                                    : dto.fields.telegramId.toString()
                                : undefined,
                        description:
                            dto.fields.description !== undefined
                                ? dto.fields.description
                                : undefined,
                        email: dto.fields.email !== undefined ? dto.fields.email : undefined,
                        hwidDeviceLimit: dto.fields.hwidDeviceLimit,
                    },
                },
            })),
        );
    }

    public async expireUserNotifications(payload: Record<string, string>) {
        return this.serialUsersOperationsQueue.add(
            USERS_JOB_NAMES.EXPIRE_USER_NOTIFICATIONS,
            payload,
        );
    }

    public async addSubscriptionRequestRecord(payload: IAddUserSubscriptionRequestHistoryPayload) {
        return this.subscriptionRequestsQueue.add(
            USERS_JOB_NAMES.ADD_SUBSCRIPTION_REQUEST_RECORD,
            payload,
            {
                removeOnComplete: {
                    age: 3_600,
                    count: 500,
                },
                removeOnFail: {
                    age: 24 * 3_600,
                },
                deduplication: {
                    id: md5(`${payload.userUuid}_AR`),
                },
            },
        );
    }

    public async updateUserSub(payload: IUpdateUserSubPayload) {
        return this.subscriptionRequestsQueue.add(USERS_JOB_NAMES.UPDATE_USER_SUB, payload, {
            removeOnComplete: {
                age: 3_600,
                count: 500,
            },
            removeOnFail: {
                age: 24 * 3_600,
            },
            deduplication: {
                id: md5(`${payload.userUuid}_USS`),
            },
        });
    }

    public async checkAndUpsertHwidDevice(payload: ICheckAndUpsertHwidDevicePayload) {
        return this.subscriptionRequestsQueue.add(USERS_JOB_NAMES.UPSERT_HWID_DEVICE, payload, {
            removeOnComplete: {
                age: 3_600,
                count: 100,
            },
            removeOnFail: {
                age: 24 * 3_600,
            },
            deduplication: {
                id: md5(`${payload.userUuid}-${payload.hwid}_CAUHD`),
            },
        });
    }

    public async resetDailyUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_DAILY_USER_TRAFFIC, {});
    }

    public async resetMonthlyUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_MONTHLY_USER_TRAFFIC, {});
    }

    public async resetWeeklyUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_WEEKLY_USER_TRAFFIC, {});
    }

    public async resetNoResetUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_NO_RESET_USER_TRAFFIC, {});
    }

    public async bulkDeleteByStatus(status: TUsersStatus) {
        return this.serialUsersOperationsQueue.add(USERS_JOB_NAMES.DELETE_BY_STATUS, { status });
    }

    public async findExceededUsers() {
        return this.usersWatchdogQueue.add(
            USERS_JOB_NAMES.FIND_EXCEEDED_TRAFFIC_USAGE_USERS,
            {},
            {
                jobId: `${USERS_JOB_NAMES.FIND_EXCEEDED_TRAFFIC_USAGE_USERS}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async findExpiredUsers() {
        return this.usersWatchdogQueue.add(
            USERS_JOB_NAMES.FIND_EXPIRED_USERS,
            {},
            {
                jobId: `${USERS_JOB_NAMES.FIND_EXPIRED_USERS}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async findUsersForThresholdNotification() {
        return this.usersWatchdogQueue.add(
            USERS_JOB_NAMES.FIND_USERS_FOR_THRESHOLD_NOTIFICATION,
            {},
            {
                jobId: `${USERS_JOB_NAMES.FIND_USERS_FOR_THRESHOLD_NOTIFICATION}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async findNotConnectedUsersNotification() {
        return this.usersWatchdogQueue.add(
            USERS_JOB_NAMES.FIND_NOT_CONNECTED_USERS_NOTIFICATION,
            {},
            {
                jobId: `${USERS_JOB_NAMES.FIND_NOT_CONNECTED_USERS_NOTIFICATION}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async fireUserEventBulk(payload: IFireUserEventPayload) {
        const chunks = chunk(payload.users, 3000);

        for (const batch of chunks) {
            await this.userEventsQueue.addBulk(
                batch.map((user) => ({
                    name: USERS_JOB_NAMES.FIRE_USER_EVENT,
                    data: {
                        tId: user.tId.toString(),
                        meta: payload.meta,
                        userEvent: payload.userEvent,
                        skipTelegramNotification: payload.skipTelegramNotification,
                    } satisfies IFireUserEventJobData,
                })),
            );
        }
    }

    public async bulkUpdateAllUsers(payload: BulkAllUpdateUsersRequestDto) {
        return this.serialUsersOperationsQueue.add(USERS_JOB_NAMES.BULK_UPDATE_ALL_USERS, {
            dto: payload,
        });
    }

    public async resetAllUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_ALL_USER_TRAFFIC, {});
    }

    public async bulkAllExtendExpirationDate(extendDays: number) {
        return this.serialUsersOperationsQueue.add(
            USERS_JOB_NAMES.BULK_ALL_EXTEND_EXPIRATION_DATE,
            { extendDays },
        );
    }

    public async updateUserUsage(payload: { u: string; b: string; n: string }[]) {
        const chunks = this.chunks(payload, 1500);
        for await (const chunk of chunks) {
            await this.updateUsersUsageQueue.add(USERS_JOB_NAMES.UPDATE_USERS_USAGE, chunk, {
                removeOnComplete: {
                    age: 3_600,
                    count: 1_000,
                },
                removeOnFail: {
                    age: 24 * 3_600,
                },
                attempts: 3,
                backoff: {
                    type: 'fixed',
                    delay: 1_000,
                },
            });
        }
    }

    private async *chunks<T>(arr: T[], n: number): AsyncGenerator<T[], void> {
        for (let i = 0; i < arr.length; i += n) {
            yield arr.slice(i, i + n);
        }
    }
}
