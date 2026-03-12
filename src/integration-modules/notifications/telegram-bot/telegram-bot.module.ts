import { NestjsGrammyModule } from '@kastov/grammy-nestjs';
import { ProxyAgent } from 'proxy-agent';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, Logger } from '@nestjs/common';

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
                const token = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
                const proxy = configService.get<string | undefined>('TELEGRAM_BOT_PROXY');
                const agent = proxy
                    ? new ProxyAgent({
                          getProxyForUrl: () => proxy,
                      })
                    : undefined;

                return {
                    token: token,
                    disableUpdates: true,
                    options: {
                        client: {
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
export class TelegramBotModule {
    private readonly logger = new Logger(TelegramBotModule.name);

    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        const proxy = this.configService.get<string | undefined>('TELEGRAM_BOT_PROXY');
        if (proxy) {
            this.logger.log(`Using proxy ${proxy}`);
        }
    }
}
