import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { PasskeyEntity } from '@modules/admin/entities';

export class CreatePasskeyCommand extends Command<TResult<PasskeyEntity>> {
    constructor(public readonly passkeyEntity: PasskeyEntity) {
        super();
    }
}
