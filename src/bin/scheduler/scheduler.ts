(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import { createLogger } from 'winston';
import compression from 'compression';
import * as winston from 'winston';
import utc from 'dayjs/plugin/utc';
import { json } from 'express';
import helmet from 'helmet';
import dayjs from 'dayjs';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { NotFoundExceptionFilter } from '@common/exception/not-found-exception.filter';
import { getRedisConnectionOptions } from '@common/utils/get-redis-connection-options';
import { WorkerRoutesGuard } from '@common/guards/worker-routes/worker-routes.guard';
import { customLogFilter } from '@common/utils/filter-logs/filter-logs';
import { isDevelopment } from '@common/utils/startup-app';
import { AxiosService } from '@common/axios';
import { BULLBOARD_ROOT, HEALTH_ROOT, METRICS_ROOT } from '@libs/contracts/api';

import { SchedulerRootModule } from './scheduler.root.module';

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

const instanedId = process.env.INSTANCE_ID || '0';

const logger = createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        customLogFilter(),
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        // winston.format.ms(),
        winston.format.align(),
        nestWinstonModuleUtilities.format.nestLike(`Scheduler: #${instanedId}`, {
            colors: true,
            prettyPrint: true,
            processId: false,
            appName: true,
        }),
    ),
    level: isDevelopment() ? 'debug' : 'http',
});

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(SchedulerRootModule, {
        logger: WinstonModule.createLogger({
            instance: logger,
        }),
    });

    app.use(json({ limit: '100mb' }));

    const config = app.get(ConfigService);

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

    app.useGlobalFilters(new NotFoundExceptionFilter());

    app.useGlobalGuards(
        new WorkerRoutesGuard({ allowedPaths: [METRICS_ROOT, BULLBOARD_ROOT, HEALTH_ROOT] }),
    );

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.REDIS,
        options: {
            ...getRedisConnectionOptions(
                config.get<string>('REDIS_SOCKET'),
                config.get<string>('REDIS_HOST'),
                config.get<number>('REDIS_PORT'),
                'ioredis',
            ),
            db: config.getOrThrow<number>('REDIS_DB'),
            password: config.get<string | undefined>('REDIS_PASSWORD'),
            keyPrefix: 'nmicro:',
        },
    });

    await app.startAllMicroservices();

    app.enableShutdownHooks();

    await app.listen(Number(config.getOrThrow<string>('METRICS_PORT')));

    const axiosService = app.get(AxiosService);
    await axiosService.setJwt();
}
void bootstrap();
