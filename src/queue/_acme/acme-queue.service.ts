import { Queue } from 'bullmq';
import _ from 'lodash';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { QUEUES_NAMES } from '../queue.enum';
import { AbstractQueueService } from '../queue.service';
import { ACME_JOB_NAMES } from './constants';

@Injectable()
export class AcmeQueueService extends AbstractQueueService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QUEUES_NAMES.ACME.ISSUE)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QUEUES_NAMES.ACME.ISSUE)
        private readonly acmeQueue: Queue,
    ) {
        super();
        this._queue = this.acmeQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();

        // One order at a time across the whole installation: CAs rate-limit by
        // account, and two orders for the same name would fight over the same
        // challenge record.
        await this.queue.setGlobalConcurrency(1);
    }

    public async issueCertificate(payload: { certificateUuid: string; force?: boolean }) {
        return this.addJob(ACME_JOB_NAMES.ISSUE_CERTIFICATE, payload, {
            // Keyed by certificate, so a scheduler tick that overlaps a manual
            // "issue now" does not queue the same order twice.
            jobId: payload.certificateUuid,
            // Retries are the engine's business: it records the failure, backs
            // off and lets the scheduler pick the certificate up again.
            attempts: 1,
            removeOnComplete: true,
        });
    }
}
