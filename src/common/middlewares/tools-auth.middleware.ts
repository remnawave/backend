import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getQuery } from 'ufo';

import { Logger } from '@nestjs/common';

import { HttpExceptionWithErrorCodeType } from '@common/exception/http-exeception-with-error-code.type';
import { isDevelopment } from '@common/utils/startup-app';
import { BACKEND_TOOLS_ROOT, ROOT } from '@libs/contracts/api';
import {
    BACKEND_TOOLS_AUTH_COOKIE_NAME,
    BACKEND_TOOLS_JWT_ISSUER,
    BACKEND_TOOLS_JWT_LIFETIME_HOURS,
    BACKEND_TOOLS_JWT_SCOPES,
    ERRORS,
    TBackendToolsJwtScope,
} from '@libs/contracts/constants';

import { rejectRequest } from './reject-request';

const logger = new Logger('ToolsAuth');

const FORBIDDEN = new HttpExceptionWithErrorCodeType(
    ERRORS.FORBIDDEN.message,
    ERRORS.FORBIDDEN.code,
    ERRORS.FORBIDDEN.httpCode,
);

export function toolsAuthMiddleware(appSecret: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { ott } = getQuery(req.originalUrl);

        if (typeof ott === 'string' && ott.length > 0) {
            if (verifyJwt(ott, appSecret, 'ott')) {
                const token = signJwt(appSecret);

                res.cookie(BACKEND_TOOLS_AUTH_COOKIE_NAME, token, {
                    httpOnly: true,
                    secure: !isDevelopment(),
                    sameSite: 'lax',
                    path: `${ROOT}${BACKEND_TOOLS_ROOT}`,
                    maxAge: BACKEND_TOOLS_JWT_LIFETIME_HOURS * 3_600_000,
                });

                const redirectUrl = new URL(req.originalUrl, 'http://localhost');
                redirectUrl.searchParams.delete('ott');

                const toolsRoot = `${ROOT}${BACKEND_TOOLS_ROOT}/`;
                const redirectTarget = redirectUrl.pathname.startsWith(toolsRoot)
                    ? redirectUrl.pathname + redirectUrl.search
                    : toolsRoot;

                logger.warn(
                    `Tools access granted. Request: ${redirectTarget}. IP: ${'clientIp' in req ? req.clientIp : 'unknown'}`,
                );

                res.redirect(redirectTarget);

                return;
            } else {
                return rejectRequest(req, res, FORBIDDEN);
            }
        }

        if (!hasValidCookie(req, appSecret)) {
            return rejectRequest(req, res, FORBIDDEN);
        }

        return next();
    };
}

function hasValidCookie(req: Request, appSecret: string): boolean {
    const token = getCookie(req, BACKEND_TOOLS_AUTH_COOKIE_NAME);

    if (!token) {
        return false;
    }

    return verifyJwt(token, appSecret, BACKEND_TOOLS_JWT_SCOPES.ACCESS);
}

function getCookie(req: Request, name: string): string | null {
    const header = req.headers.cookie;

    if (!header) {
        return null;
    }

    for (const part of header.split(';')) {
        const [key, ...rest] = part.trim().split('=');

        if (key === name) {
            try {
                return decodeURIComponent(rest.join('='));
            } catch {
                return null;
            }
        }
    }

    return null;
}

function signJwt(appSecret: string) {
    return jwt.sign({ scope: BACKEND_TOOLS_JWT_SCOPES.ACCESS }, appSecret, {
        expiresIn: `${BACKEND_TOOLS_JWT_LIFETIME_HOURS}h`,
        issuer: BACKEND_TOOLS_JWT_ISSUER,
    });
}

function verifyJwt(token: string, appSecret: string, scope: TBackendToolsJwtScope): boolean {
    try {
        const decoded = jwt.verify(token, appSecret, {
            algorithms: ['HS256'],
            issuer: BACKEND_TOOLS_JWT_ISSUER,
            ignoreExpiration: false,
        });

        return typeof decoded === 'object' && decoded.scope === scope;
    } catch {
        return false;
    }
}
