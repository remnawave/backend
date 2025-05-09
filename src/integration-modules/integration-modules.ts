import { ConditionalModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { WebhookModule } from './webhook-module/webhook.module';

@Module({
    imports: [
        ConditionalModule.registerWhen(TelegramBotModule, 'IS_TELEGRAM_NOTIFICATIONS_ENABLED'),
        ConditionalModule.registerWhen(WebhookModule, 'WEBHOOK_ENABLED'),
    ],
})
export class IntegrationModules {}
