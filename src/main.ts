import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { createLogger } from 'winston';
import compression from 'compression';
import * as winston from 'winston';
import requestIp from 'request-ip';
import { json } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { ROOT } from '@contract/api';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import {
    getDocs,
    isCrowdinEditorEnabled,
    isDevelopment,
    isProduction,
} from '@common/utils/startup-app';
import { getStartMessage } from '@common/utils/startup-app/get-start-message';
import { proxyCheckMiddleware, getRealIp } from '@common/middlewares';
import { customLogFilter } from '@common/utils/filter-logs';
import { AxiosService } from '@common/axios';

import { AppModule } from './app.module';

patchNestJsSwagger();

// const levels = {
//     error: 0,
//     warn: 1,
//     info: 2,
//     http: 3,
//     verbose: 4,
//     debug: 5,
//     silly: 6,
// };

const instanceId = process.env.INSTANCE_ID || '0';

const logger = createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        customLogFilter(),
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        // winston.format.ms(),
        winston.format.align(),
        nestWinstonModuleUtilities.format.nestLike(`API Server: #${instanceId}`, {
            colors: true,
            prettyPrint: true,
            processId: false,
            appName: true,
        }),
    ),
    level: isDevelopment() ? 'debug' : 'http',
});

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            instance: logger,
        }),
    });

    app.use(json({ limit: '100mb' }));

    app.use(requestIp.mw());

    const config = app.get(ConfigService);

    if (!isCrowdinEditorEnabled()) {
        app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'", '*'],
                        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
                        imgSrc: ["'self'", 'data:', '*'],
                        connectSrc: ["'self'", '*'],
                        workerSrc: ["'self'", 'blob:', '*'],
                        frameSrc: ["'self'", 'oauth.telegram.org', '*'],
                        frameAncestors: ["'self'", '*'],
                    },
                },

                crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
                crossOriginResourcePolicy: { policy: 'same-site' },
                referrerPolicy: {
                    policy: 'strict-origin-when-cross-origin',
                },
            }),
        );
    }

    app.use(compression());

    app.use(getRealIp);

    if (config.getOrThrow<string>('IS_HTTP_LOGGING_ENABLED') === 'true') {
        if (isProduction()) {
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
    }

    app.use(proxyCheckMiddleware);

    // if (config.getOrThrow<boolean>('COOKIE_AUTH_ENABLED')) {
    //     app.use(cookieParser());
    //     app.use(
    //         checkAuthCookieMiddleware(
    //             config.getOrThrow<string>('JWT_AUTH_SECRET'),
    //             config.getOrThrow<string>('COOKIE_AUTH_NONCE'),
    //         ),
    //     );
    // }

    app.setGlobalPrefix(ROOT);

    await getDocs(app, config);

    app.enableCors({
        origin: isDevelopment() ? '*' : config.getOrThrow<string>('FRONT_END_DOMAIN'),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: false,
    });

    app.useGlobalPipes(new ZodValidationPipe());

    app.enableShutdownHooks();

    await app.listen(Number(config.getOrThrow<string>('APP_PORT')));

    const axiosService = app.get(AxiosService);
    await axiosService.setJwt();

    // process.on('SIGINT', async () => {
    //     console.log('SIGINT, waiting for profiling...');

    //     await new Promise((resolve) => setTimeout(resolve, 2000));

    //     await app.close();
    // });

    logger.info('\n' + (await getStartMessage()) + '\n');
}
void bootstrap();
