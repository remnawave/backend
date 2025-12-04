import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';
import { TResetPeriods } from '@libs/contracts/constants';

export class BatchResetLimitedUsersTrafficCommand extends Command<TResult<{ tId: bigint }[]>> {
    constructor(public readonly strategy: TResetPeriods) {
        super();
    }
}
