import { InjectBot } from '@kastov/grammy-nestjs';
import { Context } from 'grammy';
import { Bot } from 'grammy';
import dayjs from 'dayjs';

import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { prettyBytesUtil } from '@common/utils/bytes';
import { EVENTS } from '@libs/contracts/constants';

import { BOT_NAME } from '@integration-modules/webhook-module/constants/bot-name.constant';

import { TelegramBotLoggerQueueService } from '@queue/loggers/telegram-bot-logger';

import { NodeEvent } from './interfaces';

export class NodesEvents {
    private readonly notifyChatId: string;
    private readonly nodesNotifyThreadId: string | undefined;

    constructor(
        @InjectBot(BOT_NAME)
        private readonly _: Bot<Context>,

        private readonly telegramBotLoggerQueueService: TelegramBotLoggerQueueService,
        private readonly configService: ConfigService,
    ) {
        this.notifyChatId = this.configService.getOrThrow<string>('TELEGRAM_NOTIFY_NODES_CHAT_ID');
        this.nodesNotifyThreadId = this.configService.get<string>(
            'TELEGRAM_NOTIFY_NODES_THREAD_ID',
        );
    }

    @OnEvent(EVENTS.NODE.CREATED)
    async onNodeCreated(event: NodeEvent): Promise<void> {
        const msg = `
💻 <b>#nodeCreated</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Address:</b> <code>${event.node.address}</code>
<b>Port:</b> <code>${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.MODIFIED)
    async onNodeModified(event: NodeEvent): Promise<void> {
        const msg = `
📝 <b>#nodeModified</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Address:</b> <code>${event.node.address}</code>
<b>Port:</b> <code>${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.DISABLED)
    async onNodeDisabled(event: NodeEvent): Promise<void> {
        const msg = `
⚠️ <b>#nodeDisabled</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Address:</b> <code>${event.node.address}</code>
<b>Port:</b> <code>${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.ENABLED)
    async onNodeEnabled(event: NodeEvent): Promise<void> {
        const msg = `
🟩 <b>#nodeEnabled</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Address:</b> <code>${event.node.address}</code>
<b>Port:</b> <code>${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.CONNECTION_LOST)
    async onNodeConnectionLost(event: NodeEvent): Promise<void> {
        const msg = `
🚨 <b>#nodeConnectionLost</b>
<b>Connection to node lost</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Reason:</b> <code>${event.node.lastStatusMessage}</code>
<b>Last status change:</b> <code>${dayjs(event.node.lastStatusChange).format('DD.MM.YYYY HH:mm')}</code>
<b>Address:</b> <code>${event.node.address}:${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.CONNECTION_RESTORED)
    async onNodeConnectionRestored(event: NodeEvent): Promise<void> {
        const msg = `
❇️ <b>#nodeConnectionRestored</b>
<b>Connection to node restored</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Reason:</b> <code>${event.node.lastStatusMessage}</code>
<b>Last status change:</b> <code>${dayjs(event.node.lastStatusChange).format('DD.MM.YYYY HH:mm')}</code>
<b>Address:</b> <code>${event.node.address}:${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.DELETED)
    async onNodeDeleted(event: NodeEvent): Promise<void> {
        const msg = `
💀 <b>#nodeDeleted</b>
<b>Node deleted</b>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Address:</b> <code>${event.node.address}:${event.node.port}</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }

    @OnEvent(EVENTS.NODE.TRAFFIC_NOTIFY)
    async onNodeTrafficNotify(event: NodeEvent): Promise<void> {
        const used = prettyBytesUtil(Number(event.node.trafficUsedBytes), true, 3, true);
        const limit = prettyBytesUtil(Number(event.node.trafficLimitBytes), true, 3, true);

        const msg = `
📊 <b>#nodeTrafficNotify</b>
<b>Bandwidth limit reached</b>
🌐 <code>${used}</code> <b>/</b> <code>${limit}</code>
➖➖➖➖➖➖➖➖➖
<b>Name:</b> <code>${event.node.name}</code>
<b>Address:</b> <code>${event.node.address}:${event.node.port}</code>
<b>Traffic reset day:</b> <code>${event.node.trafficResetDay}</code>
<b>Percent:</b> <code>${event.node.notifyPercent} %</code>
        `;
        await this.telegramBotLoggerQueueService.addJobToSendTelegramMessage({
            message: msg,
            chatId: this.notifyChatId,
            threadId: this.nodesNotifyThreadId,
        });
    }
}
