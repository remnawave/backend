import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { SQUADS_JOB_NAMES } from './constants';
import { QUEUES_NAMES } from '../queue.enum';

@Injectable()
export class SquadsQueueService extends AbstractQueueService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QUEUES_NAMES.SQUADS.ACTIONS)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QUEUES_NAMES.SQUADS.ACTIONS)
        private readonly squadsQueue: Queue,
    ) {
        super();
        this._queue = this.squadsQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(1);
    }

    public async addUsersToExternalSquad(payload: { externalSquadUuid: string }) {
        return this.addJob(SQUADS_JOB_NAMES.ADD_USERS_TO_EXTERNAL_SQUAD, payload);
    }

    public async removeUsersFromExternalSquad(payload: { externalSquadUuid: string }) {
        return this.addJob(SQUADS_JOB_NAMES.REMOVE_USERS_FROM_EXTERNAL_SQUAD, payload);
    }

    public async addUsersToInternalSquad(payload: { internalSquadUuid: string }) {
        return this.addJob(SQUADS_JOB_NAMES.ADD_USERS_TO_INTERNAL_SQUAD, payload);
    }

    public async removeUsersFromInternalSquad(payload: { internalSquadUuid: string }) {
        return this.addJob(SQUADS_JOB_NAMES.REMOVE_USERS_FROM_INTERNAL_SQUAD, payload);
    }
}
