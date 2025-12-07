import { Global, Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { getRedisConnectionOptions } from '@common/utils/get-redis-connection-options';

import { MICROSERVICES_NAMES } from './microservices-names.constant';

@Global()
@Module({
    imports: [
        ConfigModule,
        ClientsModule.registerAsync({
            isGlobal: true,
            clients: [
                {
                    imports: [ConfigModule],
                    name: MICROSERVICES_NAMES.REDIS_PRODUCER,

                    useFactory: async (configService: ConfigService) => ({
                        transport: Transport.REDIS,
                        options: {
                            ...getRedisConnectionOptions(
                                configService.get<string>('REDIS_SOCKET'),
                                configService.get<string>('REDIS_HOST'),
                                configService.get<number>('REDIS_PORT'),
                                'ioredis',
                            ),
                            db: configService.getOrThrow<number>('REDIS_DB'),
                            password: configService.get<string | undefined>('REDIS_PASSWORD'),
                            keyPrefix: 'nmicro:',
                        },
                    }),
                    inject: [ConfigService],
                },
            ],
        }),
    ],
    providers: [],
    exports: [],
})
export class RedisProducerModule implements OnApplicationBootstrap {
    constructor(@Inject(MICROSERVICES_NAMES.REDIS_PRODUCER) private client: ClientProxy) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.client.connect();
    }
}
