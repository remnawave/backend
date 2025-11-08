import { Module } from '@nestjs/common';

import { ResponseRulesMatcherService } from './services/response-rules-matcher.service';
import { ResponseRulesParserService } from './services/response-rules-parser.service';

@Module({
    providers: [ResponseRulesParserService, ResponseRulesMatcherService],
    exports: [ResponseRulesParserService, ResponseRulesMatcherService],
})
export class SubscriptionResponseRulesModule {}
