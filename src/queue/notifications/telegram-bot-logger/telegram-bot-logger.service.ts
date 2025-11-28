import { Queue } from 'bullmq';
import _ from 'lodash';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { AbstractQueueService } from '../../queue.service';
import { TelegramBotLoggerJobNames } from './enums';
import { QueueNames } from '../../queue.enum';

@Injectable()
export class TelegramBotLoggerQueueService
    extends AbstractQueueService
    implements OnApplicationBootstrap
{
    protected readonly logger: Logger = new Logger(
        _.upperFirst(_.camelCase(QueueNames.telegramBotLogger)),
    );

    private _queue: Queue;

    get queue(): Queue {
        return this._queue;
    }

    constructor(
        @InjectQueue(QueueNames.telegramBotLogger) private readonly telegramBotLoggerQueue: Queue,
    ) {
        super();
        this._queue = this.telegramBotLoggerQueue;
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.checkConnection();
        await this.queue.setGlobalConcurrency(200);
    }

    public async addJobToSendTelegramMessage(payload: {
        message: string;
        chatId: string;
        threadId: string | undefined;
    }) {
        return this.addJob(TelegramBotLoggerJobNames.sendTelegramMessage, payload);
    }

    public async rateLimit(seconds: number) {
        return this.queue.rateLimit(seconds * 1000);
    }
}
