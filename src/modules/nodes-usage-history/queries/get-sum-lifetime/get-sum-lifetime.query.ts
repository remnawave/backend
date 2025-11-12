import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

export class GetSumLifetimeQuery extends Query<
    ICommandResponse<{
        totalBytes: string;
    }>
> {
    constructor() {
        super();
    }
}
