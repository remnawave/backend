import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { FirstConnectedUsersJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Injectable()
export class FirstConnectedUsersQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.firstConnectedUsers)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.firstConnectedUsers)
        private readonly firstConnectedUsersQueue: Queue,
    ) {
        super();
        this._queue = this.firstConnectedUsersQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async addFirstConnectedUsersBulkJob(
        users: {
            tId: bigint;
        }[],
    ) {
        return this.addBulk(
            users.map((user) => ({
                name: FirstConnectedUsersJobNames.handleFirstConnectedUsers,
                data: { tId: user.tId.toString() },
                options: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            })),
        );
    }
}
