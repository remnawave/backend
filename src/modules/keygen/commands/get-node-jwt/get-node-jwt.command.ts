import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export interface IGetNodeJwtResponse {
    jwtToken: string;
    clientCert: string;
    clientKey: string;
    caCert: string;
}

export class GetNodeJwtCommand extends Command<TResult<IGetNodeJwtResponse>> {
    constructor() {
        super();
    }
}
