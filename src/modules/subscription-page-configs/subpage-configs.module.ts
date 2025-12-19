import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { SubscriptionPageConfigRepository } from './repositories/subpage-configs.repository';
import { SubscriptionPageConfigController } from './subpage-configs.controller';
import { SubscriptionPageConfigConverter } from './subpage-configs.converter';
import { SubscriptionPageConfigService } from './subpage-configs.service';

@Module({
    imports: [CqrsModule],
    controllers: [SubscriptionPageConfigController],
    providers: [
        SubscriptionPageConfigService,
        SubscriptionPageConfigRepository,
        SubscriptionPageConfigConverter,
    ],
    exports: [],
})
export class SubscriptionPageConfigModule {}
