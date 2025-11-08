import { Command } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

export class ExternalSquadBulkActionsCommand extends Command<
    ICommandResponse<{
        affectedRows: number;
    }>
> {
    constructor(
        public readonly externalSquadUuid: string,
        public readonly action: 'add' | 'remove',
    ) {
        super();
    }
}
