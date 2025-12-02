import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

export class GetUsersByExpireAtQuery extends Query<ICommandResponse<{ tId: bigint }[]>> {
    constructor(
        public readonly start: Date,
        public readonly end: Date,
    ) {
        super();
    }
}
