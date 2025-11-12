import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { StartAllNodesJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Injectable()
export class StartAllNodesQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.startAllNodes)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QueueNames.startAllNodes) private readonly startAllNodesQueue: Queue) {
        super();
        this._queue = this.startAllNodesQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async startAllNodes(payload: { emitter: string; force?: boolean }) {
        return this.addJob(StartAllNodesJobNames.startAllNodes, payload, {
            deduplication: {
                id: StartAllNodesJobNames.startAllNodes,
            },
        });
    }

    public async startAllNodesWithoutDeduplication(payload: { emitter: string }, delay?: number) {
        return this.addJob(StartAllNodesJobNames.startAllNodes, payload, {
            delay,
        });
    }
}
