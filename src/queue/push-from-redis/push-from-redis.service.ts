import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { IRecordUserUsageFromRedisPayload } from './interfaces';
import { AbstractQueueService } from '../queue.service';
import { PushFromRedisJobNames } from './enums';
import { QUEUES_NAMES } from '../queue.enum';

@Injectable()
export class PushFromRedisQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QUEUES_NAMES.PUSH_TO_DB)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QUEUES_NAMES.PUSH_TO_DB) private readonly pushFromRedisQueue: Queue) {
        super();
        this._queue = this.pushFromRedisQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async recordUserUsageDelayed(payload: IRecordUserUsageFromRedisPayload) {
        return this.addJob(PushFromRedisJobNames.recordUserUsage, payload, {
            delay: 120_000, // 2 minutes
            deduplication: {
                id: `${payload.redisKey}_PFR`,
            },
            removeOnComplete: {
                age: 3_600,
                count: 300,
            },
            removeOnFail: {
                age: 24 * 3_600,
            },
        });
    }
}
