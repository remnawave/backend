import { Command } from '@nestjs/cqrs';

export class BulkAllExtendExpirationDateCommand extends Command<void> {
    constructor(public readonly extendDays: number) {
        super();
    }
}
