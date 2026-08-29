(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
import 'zod/compile';

process.title = 'rw-scheduler';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { json } from 'express';
import helmet from 'helmet';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { createLogger } from 'winston';
import * as winston from 'winston';

import { NestFactory } from '@nestjs/core';

import { TypedConfigService } from '@common/config/app-config';
import { NotFoundExceptionFilter } from '@common/exception/not-found-exception.filter';
import { WorkerRoutesGuard } from '@common/guards/worker-routes/worker-routes.guard';
import { customLogFilter } from '@common/utils/filter-logs/filter-logs';
import { isDevOrDebugLogsEnabled } from '@common/utils/startup-app';
import { getStartMessage } from '@common/utils/startup-app/get-start-message';
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
        nestWinstonModuleUtilities.format.nestLike(`cron-${instanedId}`, {
            colors: true,
            prettyPrint: true,
            processId: false,
            appName: true,
        }),
    ),
    level: isDevOrDebugLogsEnabled() ? 'debug' : 'http',
});

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(SchedulerRootModule, {
        logger: WinstonModule.createLogger({
            instance: logger,
        }),
    });

    app.use(json({ limit: '100mb' }));

    const config = app.get(TypedConfigService);

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

    app.useGlobalFilters(new NotFoundExceptionFilter());

    app.useGlobalGuards(
        new WorkerRoutesGuard({ allowedPaths: [METRICS_ROOT, BULLBOARD_ROOT, HEALTH_ROOT] }),
    );

    app.enableShutdownHooks();

    await app.listen(config.getOrThrow('METRICS_PORT'));

    logger.info('\n' + (await getStartMessage()) + '\n');

    if (import.meta.webpackHot) {
        import.meta.webpackHot.accept();
        import.meta.webpackHot.dispose(() => app.close());
    }
}
void bootstrap();
