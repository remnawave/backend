import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { UpdateUsersUsageJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Injectable()
export class UpdateUsersUsageQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.updateUsersUsage)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.updateUsersUsage) private readonly updateUsersUsageQueue: Queue,
    ) {
        super();
        this._queue = this.updateUsersUsageQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async updateUserUsage(payload: { u: string; b: string; n: string }[]) {
        const chunks = this.chunks(payload, 1500);
        for await (const chunk of chunks) {
            await this.addJob(UpdateUsersUsageJobNames.UpdateUsersUsage, chunk, {
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
