import { Command } from '@nestjs/cqrs';

type TBulkSyncUsers = 'limited' | 'expired';

export class BulkSyncUsersCommand extends Command<void> {
    constructor(public readonly type: TBulkSyncUsers) {
        super();
    }
}
