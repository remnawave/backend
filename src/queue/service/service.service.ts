import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { QUEUES_NAMES } from '../queue.enum';
import { ServiceJobNames } from './enums';

@Injectable()
export class ServiceQueueService extends AbstractQueueService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(_.upperFirst(_.camelCase(QUEUES_NAMES.SERVICE)));

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QUEUES_NAMES.SERVICE) private readonly serviceQueue: Queue) {
        super();
        this._queue = this.serviceQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(1);
    }

    public async cleanOldUsageRecords(payload: Record<string, string>) {
        return this.addJob(ServiceJobNames.CLEAN_OLD_USAGE_RECORDS, payload);
    }

    public async vacuumTables(payload: Record<string, string>) {
        return this.addJob(ServiceJobNames.VACUUM_TABLES, payload);
    }
}
