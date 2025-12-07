import { Command } from '@nestjs/cqrs';

import { NodesUserUsageHistoryEntity } from '../../entities/nodes-user-usage-history.entity';

export class BulkUpsertUserHistoryEntryCommand extends Command<void> {
    constructor(public readonly userUsageHistoryList: NodesUserUsageHistoryEntity[]) {
        super();
    }
}
