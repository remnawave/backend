import { NextFunction, Request, Response } from 'express';

import { Logger } from '@nestjs/common';

import { isDevelopment } from '@common/utils/startup-app';

const logger = new Logger('ProxyCheckMiddleware');

export function proxyCheckMiddleware(req: Request, res: Response, next: NextFunction) {
    if (isDevelopment()) {
        return next();
    }

    const isProxy = Boolean(req.headers['x-forwarded-for']);
    const isHttps = Boolean(req.headers['x-forwarded-proto'] === 'https');

    logger.debug(
        `X-Forwarded-For: ${req.headers['x-forwarded-for']}, X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`,
    );

    if (!isHttps || !isProxy) {
        res.socket?.destroy();
        logger.error('Reverse proxy and HTTPS are required.');
        return false;
    }

    return next();
}
