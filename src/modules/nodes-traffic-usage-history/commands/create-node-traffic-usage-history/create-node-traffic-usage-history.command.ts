import { Command } from '@nestjs/cqrs';

import { NodesTrafficUsageHistoryEntity } from '../../entities/nodes-traffic-usage-history.entity';

export class CreateNodeTrafficUsageHistoryCommand extends Command<void> {
    constructor(public readonly nodeTrafficUsageHistory: NodesTrafficUsageHistoryEntity) {
        super();
    }
}
