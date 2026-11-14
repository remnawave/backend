import { json, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { NestExpressApplication } from '@nestjs/platform-express';

import { TypedConfigService } from '@common/config/app-config/typed-config.service';
import {
    bodySizeLimitMiddleware,
    getRealIp,
    noRobotsMiddleware,
    preParseAuthMiddleware,
    proxyCheckMiddleware,
    toolsAuthMiddleware,
} from '@common/middlewares';
import { RequestAuthService } from '@common/request-auth/request-auth.service';
import {
    AUTH_CONTROLLER,
    BACKEND_TOOLS_ROOT,
    ROOT,
    SUBSCRIPTION_CONTROLLER,
} from '@libs/contracts/api';

import { isDevelopment } from './is-development';

const AUTH_BODY_LIMIT_BYTES = 64 * 1024;

export function registerHttpPipeline(app: NestExpressApplication): void {
    const config = app.get(TypedConfigService);

    const helmetMiddleware = helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                'script-src': ["'self'", "'wasm-unsafe-eval'"],
                'img-src': ["'self'", 'data:', 'https:'],
                'connect-src': ["'self'", 'https://raw.githubusercontent.com', 'https://ungh.cc'],
            },
        },
    });

    app.use(getRealIp);
    app.use(proxyCheckMiddleware);

    const backendToolsPath = `${ROOT}${BACKEND_TOOLS_ROOT}`;
    const isBackendToolsRequest = (req: Request): boolean =>
        req.path.toLowerCase().startsWith(backendToolsPath);

    app.use(backendToolsPath, toolsAuthMiddleware(config.getOrThrow('APP_SECRET')));

    if (!isDevelopment()) {
        app.use((req: Request, res: Response, next: NextFunction) => {
            if (isBackendToolsRequest(req)) {
                return next();
            }
            return helmetMiddleware(req, res, next);
        });
    }

    if (config.getOrThrow('IS_HTTP_LOGGING_ENABLED')) {
        app.use(
            morgan(
                ':remote-addr - ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
                // {
                //     skip: (req) => req.url === ROOT + METRICS_ROOT,
                //     stream: {
                //         write: (message) => logger.http(message.trim()),
                //     },
                // },
            ),
        );
    }

    app.use(noRobotsMiddleware);

    app.enableCors({
        origin: isDevelopment() ? '*' : config.getOrThrow('FRONT_END_DOMAIN'),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: false,
    });

    const authPath = `${ROOT}/${AUTH_CONTROLLER}`;
    const subscriptionPath = `${ROOT}/${SUBSCRIPTION_CONTROLLER}`;

    app.use(
        preParseAuthMiddleware(app.get(RequestAuthService), [
            authPath,
            subscriptionPath,
            backendToolsPath,
        ]),
    );

    app.use(subscriptionPath, bodySizeLimitMiddleware(0));
    app.use(subscriptionPath, json({ limit: 0, inflate: false }));
    app.use(authPath, bodySizeLimitMiddleware(AUTH_BODY_LIMIT_BYTES));
    app.use(authPath, json({ limit: AUTH_BODY_LIMIT_BYTES, inflate: false }));
    app.use(json({ limit: '100mb', inflate: false }));
}
