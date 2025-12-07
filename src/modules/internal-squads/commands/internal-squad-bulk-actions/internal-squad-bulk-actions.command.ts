import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class InternalSquadBulkActionsCommand extends Command<
    TResult<{
        affectedRows: number;
    }>
> {
    constructor(
        public readonly internalSquadUuid: string,
        public readonly action: 'add' | 'remove',
    ) {
        super();
    }
}
