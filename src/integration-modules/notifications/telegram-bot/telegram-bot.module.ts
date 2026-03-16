import { NestjsGrammyModule } from '@kastov/grammy-nestjs';
import { ProxyAgent } from 'proxy-agent';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { BOT_NAME } from './constants/bot-name.constant';
import { BotUpdateService } from './bot.update.service';
import { TELEGRAM_BOT_EVENTS } from './events';

@Module({
    imports: [
        ConfigModule,
        NestjsGrammyModule.forRootAsync({
            imports: [ConfigModule],
            botName: BOT_NAME,
            useFactory: async (configService: ConfigService) => {
                let agent: ProxyAgent | undefined = undefined;

                const token = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
                const apiRoot = configService.getOrThrow<string>('TELEGRAM_BOT_API_ROOT');
                const proxy = configService.get<string>('TELEGRAM_BOT_PROXY');

                if (proxy) {
                    agent = new ProxyAgent({
                        getProxyForUrl: () => proxy,
                    });
                }

                return {
                    token: token,
                    disableUpdates: true,
                    options: {
                        client: {
                            apiRoot: apiRoot,
                            baseFetchConfig: {
                                agent,
                                compress: true,
                            },
                        },
                    },
                };
            },

            inject: [ConfigService],
        }),
    ],
    controllers: [],
    providers: [BotUpdateService, ...TELEGRAM_BOT_EVENTS],
})
export class TelegramBotModule {}
