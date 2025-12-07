import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';

export class GetHostsForUserQuery extends Query<TResult<HostWithRawInbound[]>> {
    constructor(
        public readonly userId: bigint,
        public readonly returnDisabledHosts: boolean,
        public readonly returnHiddenHosts: boolean,
    ) {
        super();
    }
}
