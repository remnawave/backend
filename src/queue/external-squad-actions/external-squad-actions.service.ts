import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { ExternalSquadActionsJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Injectable()
export class ExternalSquadActionsQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.externalSquadActions)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.externalSquadActions)
        private readonly externalSquadActionsQueue: Queue,
    ) {
        super();
        this._queue = this.externalSquadActionsQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async addUsersToExternalSquad(payload: { externalSquadUuid: string }) {
        return this.addJob(ExternalSquadActionsJobNames.addUsersToExternalSquad, payload);
    }

    public async removeUsersFromExternalSquad(payload: { externalSquadUuid: string }) {
        return this.addJob(ExternalSquadActionsJobNames.removeUsersFromExternalSquad, payload);
    }
}
