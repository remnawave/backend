import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { NodesUserUsageHistoryRepository } from './repositories/nodes-user-usage-history.repository';
import { NodesUserUsageHistoryConverter } from './nodes-user-usage-history.converter';
import { COMMANDS } from './commands';

@Module({
    imports: [CqrsModule],
    controllers: [],
    providers: [NodesUserUsageHistoryRepository, NodesUserUsageHistoryConverter, ...COMMANDS],
})
export class NodesUserUsageHistoryModule {}
