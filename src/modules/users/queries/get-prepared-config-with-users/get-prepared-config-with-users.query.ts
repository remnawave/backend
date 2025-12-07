import { Query } from '@nestjs/cqrs';

import { StartXrayCommand } from '@remnawave/node-contract';

import { IXrayConfig } from '@common/helpers/xray-config/interfaces';
import { TResult } from '@common/types';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

export interface IGetPreparedConfigWithUsersResponse {
    config: IXrayConfig;
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
