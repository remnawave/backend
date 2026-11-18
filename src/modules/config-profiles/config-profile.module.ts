import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { BulkUpsertInboundUsageHistoryHandler } from './commands/bulk-upsert-inbound-usage-history';
import { ConfigProfileController } from './config-profile.controller';
import { ConfigProfileService } from './config-profile.service';
import { ConfigProfileConverter, SnippetsConverter } from './converters';
import { InboundStatsController } from './inbound-stats.controller';
import { QUERIES } from './queries';
import { ConfigProfileRepository } from './repositories/config-profile.repository';
import { SnippetsRepository } from './repositories/snippets.repository';
import { SnippetsController } from './snippets.controller';
import { SnippetsService } from './snippets.service';

@Module({
    imports: [CqrsModule],
    controllers: [ConfigProfileController, SnippetsController, InboundStatsController],
    providers: [
        ConfigProfileRepository,
        ConfigProfileService,
        ConfigProfileConverter,
        SnippetsConverter,
        SnippetsService,
        SnippetsRepository,
        BulkUpsertInboundUsageHistoryHandler,
        ...QUERIES,
    ],
})
export class ConfigProfileModule {}
