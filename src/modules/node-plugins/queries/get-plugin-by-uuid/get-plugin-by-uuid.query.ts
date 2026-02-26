import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { NodePluginEntity } from '@modules/node-plugins/entities';

export class GetPluginByUuidQuery extends Query<TResult<NodePluginEntity>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
