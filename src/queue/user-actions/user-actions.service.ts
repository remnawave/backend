import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { TUsersStatus } from '@libs/contracts/constants';

import { AbstractQueueService } from '../queue.service';
import { UserActionsJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Injectable()
export class UserActionsQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.userActions)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QueueNames.userActions) private readonly userActionsQueue: Queue) {
        super();
        this._queue = this.userActionsQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(1);
    }

    public async bulkDeleteByStatus(status: TUsersStatus) {
        return this.addJob(UserActionsJobNames.bulkDeleteByStatus, { status });
    }
}
