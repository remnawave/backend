import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvConfig } from '@common/utils/validate-env-config';

import { NotificationsConfigService } from './notifications-config.service';
import notificationsConfig from '../app-config/notifications.config';
import { configSchema, Env } from '../app-config';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: '.env',
            validate: (config) => validateEnvConfig<Env>(configSchema, config),
            load: [notificationsConfig],
        }),
    ],
    providers: [NotificationsConfigService],
    exports: [NotificationsConfigService],
})
export class CommonConfigModule {}
