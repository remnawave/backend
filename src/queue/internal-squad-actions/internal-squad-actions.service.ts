import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { InternalSquadActionsJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Injectable()
export class InternalSquadActionsQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.internalSquadActions)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.internalSquadActions)
        private readonly internalSquadActionsQueue: Queue,
    ) {
        super();
        this._queue = this.internalSquadActionsQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(1);
    }

    public async addUsersToInternalSquad(payload: { internalSquadUuid: string }) {
        return this.addJob(InternalSquadActionsJobNames.addUsersToInternalSquad, payload);
    }

    public async removeUsersFromInternalSquad(payload: { internalSquadUuid: string }) {
        return this.addJob(InternalSquadActionsJobNames.removeUsersFromInternalSquad, payload);
    }
}
