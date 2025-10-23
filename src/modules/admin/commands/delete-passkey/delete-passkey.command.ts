import { Command } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

export class DeletePasskeyCommand extends Command<ICommandResponse<boolean>> {
    constructor(public readonly id: string) {
        super();
    }
}
