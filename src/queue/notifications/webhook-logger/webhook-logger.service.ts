import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../../queue.service';
import { IBaseWebhookLogger } from './interfaces';
import { WebhookLoggerJobNames } from './enums';
import { QueueNames } from '../../queue.enum';

@Injectable()
export class WebhookLoggerQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.webhookLogger)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(@InjectQueue(QueueNames.webhookLogger) private readonly webhookLoggerQueue: Queue) {
        super();
        this._queue = this.webhookLoggerQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
    }

    public async sendWebhook(payload: IBaseWebhookLogger) {
        return this.addJob(WebhookLoggerJobNames.sendWebhook, payload);
    }

    public async sendWebhooks(payload: IBaseWebhookLogger, webhookUrls: string[]) {
        return this.addBulk(
            webhookUrls.map((url) => ({
                name: WebhookLoggerJobNames.sendWebhook,
                data: {
                    ...payload,
                    url: url,
                },
            })),
        );
    }
}
