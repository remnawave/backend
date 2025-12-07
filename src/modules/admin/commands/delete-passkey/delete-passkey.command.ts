import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class DeletePasskeyCommand extends Command<TResult<boolean>> {
    constructor(public readonly id: string) {
        super();
    }
}
