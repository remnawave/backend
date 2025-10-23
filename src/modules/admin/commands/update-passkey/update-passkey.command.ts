import { Command } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { PasskeyEntity } from '@modules/admin/entities';

export class UpdatePasskeyCommand extends Command<ICommandResponse<PasskeyEntity>> {
    constructor(
        public readonly id: string,
        public readonly data: Partial<PasskeyEntity>,
    ) {
        super();
    }
}
