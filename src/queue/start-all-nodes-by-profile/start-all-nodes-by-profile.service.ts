import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { StartAllNodesByProfileJobNames } from './enums';
import { AbstractQueueService } from '../queue.service';
import { QueueNames } from '../queue.enum';

@Injectable()
export class StartAllNodesByProfileQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.startAllNodesByProfile)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.startAllNodesByProfile)
        private readonly startAllNodesQueueByProfile: Queue,
    ) {
        super();
        this._queue = this.startAllNodesQueueByProfile;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(5);
    }

    public async startAllNodesByProfile(payload: {
        emitter: string;
        profileUuid: string;
        force?: boolean;
    }) {
        return this.addJob(StartAllNodesByProfileJobNames.startAllNodesByProfile, payload, {
            // jobId: `${StartAllNodesByProfileJobNames.startAllNodesByProfile}-${payload.profileUuid}`,
            // removeOnComplete: true,
            // removeOnFail: true,

            deduplication: {
                id: payload.profileUuid,
            },
        });
    }
}
