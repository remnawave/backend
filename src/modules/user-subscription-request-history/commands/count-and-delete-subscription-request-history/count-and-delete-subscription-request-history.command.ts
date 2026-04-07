import { Command } from '@nestjs/cqrs';

export class CountAndDeleteSubscriptionRequestHistoryCommand extends Command<void> {
    constructor(public readonly userId: bigint) {
        super();
    }
}
