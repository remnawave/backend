import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../queue.service';
import { QueueNames } from '../queue.enum';
import { UserJobsJobNames } from './enums';

@Injectable()
export class UserJobsQueueService extends AbstractQueueService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(_.upperFirst(_.camelCase(QueueNames.userJobs)));

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QueueNames.userJobs) private readonly userJobsQueue: Queue) {
        super();
        this._queue = this.userJobsQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async findExceededUsers() {
        return this.addJob(
            UserJobsJobNames.findExceededUsers,
            {},
            {
                jobId: `${UserJobsJobNames.findExceededUsers}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async findExpiredUsers() {
        return this.addJob(
            UserJobsJobNames.findExpiredUsers,
            {},
            {
                jobId: `${UserJobsJobNames.findExpiredUsers}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async findUsersForThresholdNotification() {
        return this.addJob(
            UserJobsJobNames.findUsersForThresholdNotification,
            {},
            {
                jobId: `${UserJobsJobNames.findUsersForThresholdNotification}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    public async findNotConnectedUsersNotification() {
        return this.addJob(
            UserJobsJobNames.findNotConnectedUsersNotification,
            {},
            {
                jobId: `${UserJobsJobNames.findNotConnectedUsersNotification}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }
}
