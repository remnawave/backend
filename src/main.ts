(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
import 'zod/compile';

process.title = 'rw-api';

import { BACKEND_TOOLS_ROOT, ROOT } from '@contract/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { json, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { ZodValidationPipe } from 'nestjs-zod';
import { createLogger } from 'winston';
import * as winston from 'winston';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { TypedConfigService } from '@common/config/app-config/typed-config.service';
import {
    proxyCheckMiddleware,
    getRealIp,
    noRobotsMiddleware,
    toolsAuthMiddleware,
} from '@common/middlewares';
import { customLogFilter } from '@common/utils/filter-logs';
import { getDocs, isDevelopment, isDevOrDebugLogsEnabled } from '@common/utils/startup-app';

import { AppModule } from './app.module';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

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
        nestWinstonModuleUtilities.format.nestLike(`rest-${instanceId}`, {
            colors: true,
            prettyPrint: true,
            processId: false,
            appName: true,
        }),
    ),
    level: isDevOrDebugLogsEnabled() ? 'debug' : 'http',
});

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: WinstonModule.createLogger({
            instance: logger,
        }),
    });

    app.disable('x-powered-by');

    app.use(json({ limit: '100mb' }));

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

    app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith(`${ROOT}${BACKEND_TOOLS_ROOT}`)) {
            return toolsAuthMiddleware(config.getOrThrow('APP_SECRET'))(req, res, next);
        }
        return next();
    });

    if (!isDevelopment()) {
        app.use((req: Request, res: Response, next: NextFunction) => {
            if (req.path.startsWith(`${ROOT}${BACKEND_TOOLS_ROOT}`)) {
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

    app.use(noRobotsMiddleware, proxyCheckMiddleware);

    app.setGlobalPrefix(ROOT);

    await getDocs(app);

    app.enableCors({
        origin: isDevelopment() ? '*' : config.getOrThrow('FRONT_END_DOMAIN'),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: false,
    });

    app.useGlobalPipes(new ZodValidationPipe());

    // app.useGlobalFilters(new CatchAllExceptionFilter());

    app.enableShutdownHooks();

    await app.listen(Number(config.getOrThrow('APP_PORT')));

    if (import.meta.webpackHot) {
        import.meta.webpackHot.accept();
        import.meta.webpackHot.dispose(() => app.close());
    }
}
void bootstrap();
