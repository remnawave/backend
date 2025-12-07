import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export interface IGetEnabledNodesPartialResponse {
    uuid: string;
    address: string;
    port: number | null;
    isConnected: boolean;
}

export class GetEnabledNodesPartialQuery extends Query<TResult<IGetEnabledNodesPartialResponse[]>> {
    constructor() {
        super();
    }
}
