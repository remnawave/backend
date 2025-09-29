import cors from 'cors';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SubscriptionTemplateModule } from '@modules/subscription-template/subscription-template.module';
import { QUERIES } from '@modules/subscription/queries';

import { SubscriptionController, SubscriptionsController } from './controllers';
import { SubscriptionService } from './subscription.service';

@Module({
    imports: [CqrsModule, SubscriptionTemplateModule],
    controllers: [SubscriptionController, SubscriptionsController],
    providers: [SubscriptionService, ...QUERIES],
    exports: [],
})
export class SubscriptionModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(
                cors({
                    origin: '*',
                    methods: 'GET',
                    credentials: false,
                }),
            )
            .forRoutes(SubscriptionController);
    }
}
