import { Command } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { PasskeyEntity } from '@modules/admin/entities';

export class CreatePasskeyCommand extends Command<ICommandResponse<PasskeyEntity>> {
    constructor(public readonly passkeyEntity: PasskeyEntity) {
        super();
    }
}
