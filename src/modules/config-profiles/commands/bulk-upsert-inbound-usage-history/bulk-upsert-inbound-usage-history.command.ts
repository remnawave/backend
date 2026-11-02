import { Command } from '@nestjs/cqrs';

interface IBulkUpsertInboundUsageHistoryEntry {
    inboundUuid: string;
    userId: string;
    totalBytes: string;
}

export class BulkUpsertInboundUsageHistoryCommand extends Command<void> {
    constructor(public readonly list: IBulkUpsertInboundUsageHistoryEntry[]) {
        super();
    }
}
