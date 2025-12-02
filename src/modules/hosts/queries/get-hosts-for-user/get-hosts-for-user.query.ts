import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';

export class GetHostsForUserQuery extends Query<ICommandResponse<HostWithRawInbound[]>> {
    constructor(
        public readonly userId: bigint,
        public readonly returnDisabledHosts: boolean,
        public readonly returnHiddenHosts: boolean,
    ) {
        super();
    }
}
