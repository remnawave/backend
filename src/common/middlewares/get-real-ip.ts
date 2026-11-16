import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { ClientIpService } from '@common/request-auth/client-ip.service';

morgan.token('remote-addr', (req: { clientIp: string } & Request) => {
    return req.clientIp;
});

export function getRealIp(clientIpService: ClientIpService) {
    return async (req: { clientIp: string } & Request, res: Response, next: NextFunction) => {
        req.clientIp = await clientIpService.resolve(req);

        next();
    };
}
