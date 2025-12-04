import { Command } from '@nestjs/cqrs';

export class UpdateSubLastOpenedAndUserAgentCommand extends Command<void> {
    constructor(
        public readonly userUuid: string,
        public readonly subLastOpenedAt: Date,
        public readonly subLastUserAgent: string,
    ) {
        super();
    }
}
