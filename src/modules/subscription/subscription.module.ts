import cors from 'cors';

import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SUBSCRIPTION_CONTROLLER, SUBSCRIPTION_ROUTES } from '@libs/contracts/api';

import { SubscriptionResponseRulesModule } from '@modules/subscription-response-rules/subscription-response-rules.module';
import { ResponseRulesMiddleware } from '@modules/subscription-response-rules/middleware/response-rules.middleware';
import { SubscriptionTemplateModule } from '@modules/subscription-template/subscription-template.module';

import { SubscriptionController, SubscriptionsController } from './controllers';
import { SubscriptionService } from './subscription.service';

@Module({
    imports: [CqrsModule, SubscriptionTemplateModule, SubscriptionResponseRulesModule],
    controllers: [SubscriptionController, SubscriptionsController],
    providers: [SubscriptionService],
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
        consumer
            .apply(ResponseRulesMiddleware)
            .exclude({
                path: `${SUBSCRIPTION_CONTROLLER}${SUBSCRIPTION_ROUTES.GET}/:shortUuid/info`,
                method: RequestMethod.GET,
            })
            .forRoutes(
                {
                    path: `${SUBSCRIPTION_CONTROLLER}${SUBSCRIPTION_ROUTES.GET}/:shortUuid`,
                    method: RequestMethod.GET,
                },
                {
                    path: `${SUBSCRIPTION_CONTROLLER}${SUBSCRIPTION_ROUTES.GET}/:shortUuid/:clientType`,
                    method: RequestMethod.GET,
                },
                // ...REQUEST_TEMPLATE_TYPE_VALUES.map((clientType) => ({
                //     path: `${SUBSCRIPTION_CONTROLLER}${SUBSCRIPTION_ROUTES.GET}/:shortUuid/${clientType}`,
                //     method: RequestMethod.GET,
                // })),
            );
    }
}
