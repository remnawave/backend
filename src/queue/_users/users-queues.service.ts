import { Queue } from 'bullmq';
import { chunk } from 'lodash';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';
import { md5 } from '@common/utils';
import { TUsersStatus } from '@libs/contracts/constants';

import { BulkAllUpdateUsersBodyDto, BulkUpdateUsersBodyDto } from '@modules/users/dtos';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from './constants/users-job-name.constant';
import {
    IAddUserSubscriptionRequestHistoryPayload,
    ICheckAndUpsertHwidDevicePayload,
    IFireTorrentBlockerEventJobData,
    IFireUserEventJobData,
    IFireUserEventPayload,
} from './interfaces';

@Injectable()
export class UsersQueuesService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(UsersQueuesService.name);

    constructor(
        private readonly configService: TypedConfigService,
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
            try {
                await queue.waitUntilReady();
            } catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`Queue "${queue.name}" not connected: ${reason}.`);
            }
        }

        this.logger.log(`${Object.values(this.queues).length} queues are connected.`);

        await this.serialUsersOperationsQueue.setGlobalConcurrency(1);
        await this.resetUserTrafficQueue.setGlobalConcurrency(1);
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

    public async resetUserTrafficBulk(userIds: number[]) {
        return this.modifyManyUsersQueue.addBulk(
            userIds.map((userId) => ({
                name: USERS_JOB_NAMES.RESET_MANY_USERS_TRAFFIC,
                data: { userId },
            })),
        );
    }

    public async revokeUsersSubscriptionBulk(userIds: number[]) {
        return this.modifyManyUsersQueue.addBulk(
            userIds.map((userId) => ({
                name: USERS_JOB_NAMES.REVOKE_MANY_USERS_SUBSCRIPTION,
                data: { userId },
            })),
        );
    }

    public async updateUsersBulk(dto: BulkUpdateUsersBodyDto) {
        return this.modifyManyUsersQueue.addBulk(
            dto.userIds.map((userId) => ({
                name: USERS_JOB_NAMES.UPDATE_MANY_USERS,
                data: {
                    userId,
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
                    id: md5(`${payload.userId}_AR`),
                },
            },
        );
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
                id: md5(`${payload.userId}-${payload.hwid}_CAUHD`),
            },
        });
    }

    public async resetDailyUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_DAILY_USER_TRAFFIC, {});
    }

    public async resetMonthlyUserTraffic() {
        return this.resetUserTrafficQueue.add(USERS_JOB_NAMES.RESET_MONTHLY_USER_TRAFFIC, {});
    }

    public async resetMonthlyRollingUserTraffic() {
        return this.resetUserTrafficQueue.add(
            USERS_JOB_NAMES.RESET_MONTHLY_ROLLING_USER_TRAFFIC,
            {},
        );
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
                        id: user.id.toString(),
                        meta: payload.meta,
                        userEvent: payload.userEvent,
                        skipTelegramNotification: payload.skipTelegramNotification,
                    } satisfies IFireUserEventJobData,
                })),
            );
        }
    }

    public async fireTorrentBlockerEvent(payload: IFireTorrentBlockerEventJobData) {
        return this.userEventsQueue.add(USERS_JOB_NAMES.FIRE_TORRENT_BLOCKER_EVENT, payload);
    }

    public async bulkUpdateAllUsers(payload: BulkAllUpdateUsersBodyDto) {
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
