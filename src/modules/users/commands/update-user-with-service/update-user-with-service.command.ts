import { Command } from '@nestjs/cqrs';

import { UpdateUserRequestDto } from '@modules/users/dtos';

export class UpdateUserWithServiceCommand extends Command<void> {
    constructor(public readonly dto: UpdateUserRequestDto) {
        super();
    }
}
