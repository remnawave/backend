import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { NodesUserUsageHistoryRepository } from './repositories/nodes-user-usage-history.repository';
import { NodesUserUsageHistoryConverter } from './nodes-user-usage-history.converter';
import { BandwidthStatsNodesController } from './bandwidth-stats-nodes.controller';
import { BandwidthStatsUsersController } from './bandwidth-stats-users.controller';
import { NodesUserUsageHistoryService } from './nodes-user-usage-history.service';
import { COMMANDS } from './commands';

@Module({
    imports: [CqrsModule],
    controllers: [BandwidthStatsNodesController, BandwidthStatsUsersController],
    providers: [
        NodesUserUsageHistoryRepository,
        NodesUserUsageHistoryConverter,
        NodesUserUsageHistoryService,
        ...COMMANDS,
    ],
})
export class NodesUserUsageHistoryModule {}
