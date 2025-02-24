import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createLogger } from 'winston';
import compression from 'compression';
import * as winston from 'winston';
import { json } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { getDocs, isDevelopment } from '@common/utils/startup-app';
import { getRealIp } from '@common/middlewares/get-real-ip';
import { METRICS_ROOT, ROOT } from '@contract/api';
import { AxiosService } from '@common/axios';

import { AppModule } from './app.module';
import { ProxyCheckGuard } from '@common/guards/proxy-check/proxy-check.guard';

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

const instanedId = process.env.INSTANCE_ID || '0';

const logger = createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike(`API Server: #${instanedId}`, {
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

    const config = app.get(ConfigService);

    getDocs(app, config);

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'", '*'],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
                    imgSrc: ["'self'", 'data:', '*'],
                    connectSrc: ["'self'", '*'],
                    workerSrc: ["'self'", 'blob:', '*'],
                },
            },
        }),
    );

    app.use(compression());

    app.use(getRealIp);

    app.use(
        morgan(
            ':remote-addr - ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
            {
                skip: (req) => req.url === ROOT + METRICS_ROOT,
                stream: {
                    write: (message) => logger.http(message.trim()),
                },
            },
        ),
    );

    app.setGlobalPrefix(ROOT);

    app.enableCors({
        origin: isDevelopment() ? '*' : config.getOrThrow<string>('FRONT_END_DOMAIN'),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: false,
    });

    app.useGlobalPipes(new ZodValidationPipe());

    app.useGlobalGuards(new ProxyCheckGuard({ exclude: [ROOT + METRICS_ROOT] }));

    app.enableShutdownHooks();

    await app.listen(Number(config.getOrThrow<string>('APP_PORT'))); // 127.0.0.1 will not work with docker bridge network.

    const axiosService = app.get(AxiosService);
    await axiosService.setJwt();
}
void bootstrap();
