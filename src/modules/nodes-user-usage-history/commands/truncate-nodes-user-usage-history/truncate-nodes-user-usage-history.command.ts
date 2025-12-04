import { Command } from '@nestjs/cqrs';

export class TruncateNodesUserUsageHistoryCommand extends Command<void> {
    constructor() {
        super();
    }
}
