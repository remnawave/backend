import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { PasskeyEntity } from '@modules/admin/entities';

export class UpdatePasskeyCommand extends Command<TResult<PasskeyEntity>> {
    constructor(
        public readonly id: string,
        public readonly data: Partial<PasskeyEntity>,
    ) {
        super();
    }
}
