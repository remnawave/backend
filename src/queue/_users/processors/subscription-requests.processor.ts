import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache/raw-cache.service';
import { EXPORT_TO_STREAM_KEYS } from '@libs/contracts/constants';
import { SUBSCRIPTION_REQUEST_STREAM_MESSAGE_VERSION } from '@libs/contracts/models';

import { UpsertHwidUserDeviceCommand } from '@modules/hwid-user-devices/commands/upsert-hwid-user-device';
import { HwidUserDeviceEntity } from '@modules/hwid-user-devices/entities/hwid-user-device.entity';
import { UserSubscriptionRequestHistoryEntity } from '@modules/user-subscription-request-history';
import { CountAndDeleteSubscriptionRequestHistoryCommand } from '@modules/user-subscription-request-history/commands/count-and-delete-subscription-request-history';
import { CreateSubscriptionRequestHistoryCommand } from '@modules/user-subscription-request-history/commands/create-subscription-request-history';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants';
import {
    IAddUserSubscriptionRequestHistoryPayload,
    ICheckAndUpsertHwidDevicePayload,
} from '../interfaces';

@Processor(QUEUES_NAMES.USERS.SUBSCRIPTION_REQUESTS, {
    concurrency: 50,
})
export class SubscriptionRequestsQueueProcessor
    extends WorkerHost
    implements OnApplicationBootstrap
{
    private readonly logger = new Logger(SubscriptionRequestsQueueProcessor.name);
    private readonly exportToStreamEnabled: boolean;
    private readonly exportToStreamMaxLen: number;
    private readonly disableSrhRecords: boolean;

    constructor(
        private readonly commandBus: CommandBus,
        private readonly configService: TypedConfigService,
        private readonly rawCacheService: RawCacheService,
    ) {
        super();

        this.exportToStreamEnabled = this.configService.getOrThrow('EXPORT_TO_STREAM_ENABLED');
        this.exportToStreamMaxLen = this.configService.getOrThrow('EXPORT_TO_STREAM_MAXLEN');
        this.disableSrhRecords = this.configService.getOrThrow('SERVICE_DISABLE_SRH_RECORDS');
    }

    onApplicationBootstrap() {
        if (this.disableSrhRecords) {
            this.logger.warn(
                'SERVICE_DISABLE_SRH_RECORDS is enabled, subscription request records will not be recorded.',
            );
        } else {
            this.logger.log('Subscription request records will be recorded to the database.');
        }

        if (this.exportToStreamEnabled) {
            this.logger.log(
                `[STREAM] key "${EXPORT_TO_STREAM_KEYS.PREFIX}${EXPORT_TO_STREAM_KEYS.SUBSCRIPTION_REQUESTS}", maxlen ~${this.exportToStreamMaxLen}.`,
            );
        }
    }

    async process(job: Job) {
        switch (job.name) {
            case USERS_JOB_NAMES.ADD_SUBSCRIPTION_REQUEST_RECORD:
                return await this.handleAddRecordJob(job);
            case USERS_JOB_NAMES.UPSERT_HWID_DEVICE:
                return await this.handleCheckAndUpsertHwidDeviceJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleAddRecordJob(job: Job<IAddUserSubscriptionRequestHistoryPayload>) {
        try {
            if (this.disableSrhRecords && !this.exportToStreamEnabled) {
                return;
            }

            const {
                userId: userIdString,
                requestIp,
                userAgent,
                requestAt,
                srrRuleName,
                srrResponseType,
            } = job.data;
            const userId = BigInt(userIdString);

            if (!this.disableSrhRecords) {
                await this.commandBus.execute(
                    new CreateSubscriptionRequestHistoryCommand(
                        new UserSubscriptionRequestHistoryEntity({
                            userId,
                            requestIp,
                            userAgent,
                            requestAt,
                            srrRuleName,
                            srrResponseType,
                        }),
                    ),
                );

                await this.commandBus.execute(
                    new CountAndDeleteSubscriptionRequestHistoryCommand(userId),
                );
            }

            if (this.exportToStreamEnabled) {
                await this.exportToStream({
                    userId,
                    srrResponseType,
                    requestIp,
                    userAgent,
                    requestAt,
                    srrRuleName,
                });
            }

            return;
        } catch (error) {
            this.logger.error(error);

            return;
        }
    }

    private async handleCheckAndUpsertHwidDeviceJob(job: Job<ICheckAndUpsertHwidDevicePayload>) {
        try {
            const { hwid, userId, platform, osVersion, deviceModel, userAgent, requestIp } =
                job.data;

            await this.commandBus.execute(
                new UpsertHwidUserDeviceCommand(
                    new HwidUserDeviceEntity({
                        hwid,
                        userId: BigInt(userId),
                        platform,
                        osVersion,
                        deviceModel,
                        userAgent,
                        requestIp,
                    }),
                ),
            );

            return;
        } catch (error) {
            this.logger.error(`Error checking and upserting hwid device: ${error}`);

            return;
        }
    }

    private async exportToStream(payload: {
        userId: bigint;
        srrResponseType: string;
        requestAt: Date;
        requestIp: string | undefined;
        userAgent: string | undefined;
        srrRuleName: string | undefined;
    }): Promise<void> {
        try {
            const fields: Record<string, string> = {
                v: SUBSCRIPTION_REQUEST_STREAM_MESSAGE_VERSION,
                userId: payload.userId.toString(),
                ssrResponseType: payload.srrResponseType,
                requestAt: new Date(payload.requestAt).toISOString(),
            };

            if (payload.requestIp) {
                fields.requestIp = payload.requestIp;
            }
            if (payload.userAgent) {
                fields.userAgent = payload.userAgent;
            }

            if (payload.srrRuleName) {
                fields.srrRuleName = payload.srrRuleName;
            }

            await this.rawCacheService.xaddTrimmed(
                EXPORT_TO_STREAM_KEYS.SUBSCRIPTION_REQUESTS,
                this.exportToStreamMaxLen,
                fields,
            );
        } catch (error) {
            this.logger.error(`Error exporting subscription request to stream: ${error}`);
        }
    }
}
