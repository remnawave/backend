import { Command } from '@nestjs/cqrs';

export class DeleteNodeByUuidCommand extends Command<void> {
    constructor(public readonly uuid: string) {
        super();
    }
}
