import { XrayConfig } from 'xray-typed';

import { Query } from '@nestjs/cqrs';

import { StartXrayCommand } from '@remnawave/node-contract';

import { TResult } from '@common/types';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

export interface IGetPreparedConfigWithUsersResponse {
    config: XrayConfig;
    hashesPayload: StartXrayCommand.Request['internals']['hashes'];
}

export class GetPreparedConfigWithUsersQuery extends Query<
    TResult<IGetPreparedConfigWithUsersResponse>
> {
    constructor(
        public readonly configProfileUuid: string,
        public readonly activeInbounds: ConfigProfileInboundEntity[],
    ) {
        super();
    }
}
