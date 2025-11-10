import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

export class GetUuidByUsernameQuery extends Query<
    ICommandResponse<{
        uuid: string;
        tId: bigint;
    } | null>
> {
    constructor(public readonly username: string) {
        super();
    }
}
