import { Command } from '@nestjs/cqrs';

import { NodesUsageHistoryEntity } from '../../entities/nodes-usage-history.entity';

export class UpsertHistoryEntryCommand extends Command<void> {
    constructor(public readonly nodeUsageHistory: NodesUsageHistoryEntity) {
        super();
    }
}
