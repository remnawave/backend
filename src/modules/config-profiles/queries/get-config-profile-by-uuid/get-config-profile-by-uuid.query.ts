import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { ConfigProfileWithInboundsAndNodesEntity } from '@modules/config-profiles/entities';

export class GetConfigProfileByUuidQuery extends Query<
    TResult<ConfigProfileWithInboundsAndNodesEntity>
> {
    constructor(public readonly uuid: string) {
        super();
    }
}
