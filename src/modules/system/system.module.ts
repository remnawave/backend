import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { SubscriptionResponseRulesModule } from '@modules/subscription-response-rules/subscription-response-rules.module';

import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
    imports: [CqrsModule, SubscriptionResponseRulesModule],
    controllers: [SystemController],
    providers: [SystemService],
})
export class SystemModule {}
