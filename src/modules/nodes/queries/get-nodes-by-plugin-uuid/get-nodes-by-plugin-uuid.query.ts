import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class GetNodesByPluginUuidQuery extends Query<TResult<string[]>> {
    constructor(public readonly pluginUuid: string) {
        super();
    }
}
