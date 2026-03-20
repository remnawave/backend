import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

interface IGetNodesRecapResponse {
    total: number;
    totalRam: number;
    totalCpuCores: number;
    distinctCountries: number;
}

export class GetNodesRecapQuery extends Query<TResult<IGetNodesRecapResponse>> {
    constructor() {
        super();
    }
}
