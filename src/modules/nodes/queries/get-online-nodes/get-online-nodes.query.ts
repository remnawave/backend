import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export interface IGetOnlineNodesPartialResponse {
    uuid: string;
    address: string;
    port: number | null;
    consumptionMultiplier: bigint;
    id: bigint;
}

export class GetOnlineNodesQuery extends Query<TResult<IGetOnlineNodesPartialResponse[]>> {
    constructor() {
        super();
    }
}
