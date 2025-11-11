import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { QueueNames } from '../queue.enum';
import { ServiceJobNames } from './enums';

@Injectable()
export class ServiceQueueService extends AbstractQueueService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(_.upperFirst(_.camelCase(QueueNames.service)));

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QueueNames.service) private readonly serviceQueue: Queue) {
        super();
        this._queue = this.serviceQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async cleanOldUsageRecords(payload: Record<string, string>) {
        return this.addJob(ServiceJobNames.CLEAN_OLD_USAGE_RECORDS, payload);
    }

    public async vacuumTables(payload: Record<string, string>) {
        return this.addJob(ServiceJobNames.VACUUM_TABLES, payload);
    }
}
