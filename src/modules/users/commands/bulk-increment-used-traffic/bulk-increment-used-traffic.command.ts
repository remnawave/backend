import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

interface IBulkUpdateUsedTraffic {
    u: string;
    b: string;
    n: string;
}

export class BulkIncrementUsedTrafficCommand extends Command<TResult<{ tId: bigint }[]>> {
    constructor(public readonly userUsageList: IBulkUpdateUsedTraffic[]) {
        super();
    }
}
