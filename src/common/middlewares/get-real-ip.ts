import { NextFunction, Request, Response } from 'express';
import { getClientIp } from '@kastov/request-ip';
import morgan from 'morgan';

import { REMNAWAVE_REAL_IP_HEADER, REMNAWAVE_REAL_IP_EMPTY } from '@libs/contracts/constants';

morgan.token('remote-addr', (req: { clientIp: string } & Request) => {
    return req.clientIp;
});

export const getRealIp = function (
    req: { clientIp: string } & Request,
    res: Response,
    next: NextFunction,
) {
    const ip = getClientIp(req, [REMNAWAVE_REAL_IP_HEADER]);
    if (ip) {
        req.clientIp = ip;
    } else {
        req.clientIp = REMNAWAVE_REAL_IP_EMPTY;
    }

    next();
};
