import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { CountAndDeleteSubscriptionRequestHistoryCommand } from '@modules/user-subscription-request-history/commands/count-and-delete-subscription-request-history';
import { CreateSubscriptionRequestHistoryCommand } from '@modules/user-subscription-request-history/commands/create-subscription-request-history';
import { UpdateSubLastOpenedAndUserAgentCommand } from '@modules/users/commands/update-sub-last-opened-and-user-agent';
import { UpsertHwidUserDeviceCommand } from '@modules/hwid-user-devices/commands/upsert-hwid-user-device';
import { HwidUserDeviceEntity } from '@modules/hwid-user-devices/entities/hwid-user-device.entity';
import { UserSubscriptionRequestHistoryEntity } from '@modules/user-subscription-request-history';

import {
    IAddUserSubscriptionRequestHistoryPayload,
    ICheckAndUpsertHwidDevicePayload,
    IUpdateUserSubPayload,
} from './interfaces';
import { UserSubscriptionRequestHistoryJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.userSubscriptionRequestHistory, {
    concurrency: 100,
})
export class UserSubscriptionRequestHistoryQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(UserSubscriptionRequestHistoryQueueProcessor.name);

    constructor(private readonly commandBus: CommandBus) {
        super();
    }

    async process(job: Job<any>) {
        switch (job.name) {
            case UserSubscriptionRequestHistoryJobNames.addRecord:
                return await this.handleAddRecordJob(job);
            case UserSubscriptionRequestHistoryJobNames.updateUserSub:
                return await this.handleUpdateUserSubJob(job);
            case UserSubscriptionRequestHistoryJobNames.checkAndUpserHwidUserDevice:
                return await this.handleCheckAndUpsertHwidDeviceJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleAddRecordJob(job: Job<IAddUserSubscriptionRequestHistoryPayload>) {
        try {
            const { userUuid, requestIp, userAgent, requestAt } = job.data;

            await this.commandBus.execute(
                new CreateSubscriptionRequestHistoryCommand(
                    new UserSubscriptionRequestHistoryEntity({
                        userUuid,
                        requestIp,
                        userAgent,
                        requestAt,
                    }),
                ),
            );

            await this.commandBus.execute(
                new CountAndDeleteSubscriptionRequestHistoryCommand(userUuid),
            );

            return {
                isOk: true,
            };
        } catch (error) {
            this.logger.error(error);

            return {
                isOk: false,
            };
        }
    }

    private async handleUpdateUserSubJob(job: Job<IUpdateUserSubPayload>) {
        try {
            const { userUuid, subLastOpenedAt, subLastUserAgent } = job.data;

            await this.updateSubLastOpenedAndUserAgent({
                userUuid,
                subLastOpenedAt: new Date(subLastOpenedAt),
                subLastUserAgent,
            });

            return {
                isOk: true,
            };
        } catch (error) {
            this.logger.error(`Error updating user sub: ${error}`);

            return {
                isOk: false,
            };
        }
    }

    private async handleCheckAndUpsertHwidDeviceJob(job: Job<ICheckAndUpsertHwidDevicePayload>) {
        try {
            const { hwid, userUuid, platform, osVersion, deviceModel, userAgent } = job.data;

            await this.upsertHwidUserDevice({
                hwidUserDevice: new HwidUserDeviceEntity({
                    hwid,
                    userUuid,
                    platform,
                    osVersion,
                    deviceModel,
                    userAgent,
                }),
            });

            return {
                isOk: true,
            };
        } catch (error) {
            this.logger.error(`Error checking and upserting hwid device: ${error}`);

            return {
                isOk: false,
            };
        }
    }

    private async updateSubLastOpenedAndUserAgent(
        dto: UpdateSubLastOpenedAndUserAgentCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<
            UpdateSubLastOpenedAndUserAgentCommand,
            ICommandResponse<void>
        >(
            new UpdateSubLastOpenedAndUserAgentCommand(
                dto.userUuid,
                dto.subLastOpenedAt,
                dto.subLastUserAgent,
            ),
        );
    }

    private async upsertHwidUserDevice(
        dto: UpsertHwidUserDeviceCommand,
    ): Promise<ICommandResponse<HwidUserDeviceEntity>> {
        return this.commandBus.execute<
            UpsertHwidUserDeviceCommand,
            ICommandResponse<HwidUserDeviceEntity>
        >(new UpsertHwidUserDeviceCommand(dto.hwidUserDevice));
    }
}
