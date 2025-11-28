import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { ExpireUserNotificationsJobNames } from './enums';
import { AbstractQueueService } from '../queue.service';
import { QueueNames } from '../queue.enum';

@Injectable()
export class ExpireUserNotificationsQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.expireUserNotifications)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.expireUserNotifications)
        private readonly expireUserNotificationsQueue: Queue,
    ) {
        super();
        this._queue = this.expireUserNotificationsQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(1);
    }

    public async expireUserNotifications(payload: Record<string, string>) {
        return this.addJob(ExpireUserNotificationsJobNames.expireUserNotifications, payload);
    }
}
