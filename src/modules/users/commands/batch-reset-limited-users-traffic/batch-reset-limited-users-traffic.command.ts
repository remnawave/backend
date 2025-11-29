import { Command } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { TResetPeriods } from '@libs/contracts/constants';

export class BatchResetLimitedUsersTrafficCommand extends Command<
    ICommandResponse<{ tId: bigint }[]>
> {
    constructor(public readonly strategy: TResetPeriods) {
        super();
    }
}
