import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class ExternalSquadBulkActionsCommand extends Command<
    TResult<{
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
