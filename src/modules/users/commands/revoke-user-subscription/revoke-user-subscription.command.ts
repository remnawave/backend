import { Command } from '@nestjs/cqrs';

export class RevokeUserSubscriptionCommand extends Command<void> {
    constructor(public readonly uuid: string) {
        super();
    }
}
