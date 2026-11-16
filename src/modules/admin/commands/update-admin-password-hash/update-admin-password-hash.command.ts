import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { AdminEntity } from '@modules/admin/entities/admin.entity';

export class UpdateAdminPasswordHashCommand extends Command<TResult<AdminEntity>> {
    constructor(
        public readonly uuid: string,
        public readonly passwordHash: string,
    ) {
        super();
    }
}
