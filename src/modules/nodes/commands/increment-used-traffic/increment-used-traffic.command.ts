import { Command } from '@nestjs/cqrs';

export class IncrementUsedTrafficCommand extends Command<void> {
    constructor(
        public readonly nodeUuid: string,
        public readonly bytes: bigint,
    ) {
        super();
    }
}
