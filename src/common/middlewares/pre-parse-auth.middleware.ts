import { NextFunction, Request, Response } from 'express';

import { HttpException, HttpStatus, Logger, PayloadTooLargeException } from '@nestjs/common';

import { RequestAuthService } from '@common/request-auth/request-auth.service';

import { hasRequestBody, rejectRequest } from './reject-request';

const logger = new Logger('PreParseAuth');

export function bodySizeLimitMiddleware(limitBytes: number) {
    const exception = new PayloadTooLargeException(
        limitBytes === 0 ? 'Request body is not allowed' : 'Request body is too large',
    );

    return (req: Request, res: Response, next: NextFunction) => {
        if (Number(req.headers['content-length']) > limitBytes) {
            return rejectRequest(req, res, exception);
        }

        return next();
    };
}

export function preParseAuthMiddleware(
    requestAuthService: RequestAuthService,
    publicPaths: readonly string[],
) {
    const normalizedPublicPaths = publicPaths.map((path) => path.toLowerCase());

    const isPublicPath = (path: string): boolean => {
        const lowerPath = path.toLowerCase();
        return normalizedPublicPaths.some(
            (publicPath) => lowerPath === publicPath || lowerPath.startsWith(`${publicPath}/`),
        );
    };

    return async (req: Request, res: Response, next: NextFunction) => {
        if (!hasRequestBody(req) || isPublicPath(req.path)) {
            return next();
        }

        try {
            await requestAuthService.authenticate(req);
        } catch (error) {
            if (!(error instanceof HttpException)) {
                logger.error(error);
            }

            return rejectRequest(
                req,
                res,
                error instanceof HttpException
                    ? error
                    : new HttpException(
                          {
                              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                              message: 'Internal server error',
                          },
                          HttpStatus.INTERNAL_SERVER_ERROR,
                      ),
            );
        }

        return next();
    };
}
