import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class SyncActiveProfileCommand extends Command<
    TResult<{
        affectedRows: number;
    }>
> {
    constructor() {
        super();
    }
}
