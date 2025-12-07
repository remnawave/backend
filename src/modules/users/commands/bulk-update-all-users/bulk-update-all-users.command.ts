import { Command } from '@nestjs/cqrs';

import { BaseUserEntity } from '@modules/users/entities';

export class BulkUpdateAllUsersCommand extends Command<void> {
    constructor(public readonly fields: Partial<BaseUserEntity>) {
        super();
    }
}
