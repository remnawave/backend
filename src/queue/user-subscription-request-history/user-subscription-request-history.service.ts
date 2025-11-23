import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import {
    IAddUserSubscriptionRequestHistoryPayload,
    ICheckAndUpsertHwidDevicePayload,
    IUpdateUserSubPayload,
} from './interfaces';
import { UserSubscriptionRequestHistoryJobNames } from './enums';
import { AbstractQueueService } from '../queue.service';
import { QueueNames } from '../queue.enum';

@Injectable()
export class UserSubscriptionRequestHistoryQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.userSubscriptionRequestHistory)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.userSubscriptionRequestHistory)
        private readonly userSubscriptionRequestHistoryQueue: Queue,
    ) {
        super();
        this._queue = this.userSubscriptionRequestHistoryQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async addRecord(payload: IAddUserSubscriptionRequestHistoryPayload) {
        return this.addJob(UserSubscriptionRequestHistoryJobNames.addRecord, payload, {
            removeOnComplete: {
                age: 3_600,
                count: 500,
            },
            removeOnFail: {
                age: 24 * 3_600,
            },
            deduplication: {
                id: `${payload.userUuid}_AR`,
            },
        });
    }

    public async updateUserSub(payload: IUpdateUserSubPayload) {
        return this.addJob(UserSubscriptionRequestHistoryJobNames.updateUserSub, payload, {
            removeOnComplete: {
                age: 3_600,
                count: 500,
            },
            removeOnFail: {
                age: 24 * 3_600,
            },
            deduplication: {
                id: `${payload.userUuid}_USS`,
            },
        });
    }

    public async checkAndUpsertHwidDevice(payload: ICheckAndUpsertHwidDevicePayload) {
        return this.addJob(
            UserSubscriptionRequestHistoryJobNames.checkAndUpserHwidUserDevice,
            payload,
            {
                removeOnComplete: {
                    age: 3_600,
                    count: 100,
                },
                removeOnFail: {
                    age: 24 * 3_600,
                },
                deduplication: {
                    id: `${payload.userUuid}-${payload.hwid}_CAUHD`,
                },
            },
        );
    }
}
