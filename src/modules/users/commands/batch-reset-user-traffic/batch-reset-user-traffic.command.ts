import { Command } from '@nestjs/cqrs';

import { TResetPeriods } from '@libs/contracts/constants';

export class BatchResetUserTrafficCommand extends Command<void> {
    constructor(public readonly strategy: TResetPeriods) {
        super();
    }
}
