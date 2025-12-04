import { Command } from '@nestjs/cqrs';

export class VacuumNodesUserUsageHistoryCommand extends Command<void> {
    constructor() {
        super();
    }
}
