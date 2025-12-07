(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import { createLogger } from 'winston';
import * as winston from 'winston';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

import { NestFactory } from '@nestjs/core';

import { NotFoundExceptionFilter } from '@common/exception/not-found-exception.filter';
import { WorkerRoutesGuard } from '@common/guards/worker-routes/worker-routes.guard';
import { customLogFilter } from '@common/utils/filter-logs/filter-logs';
import { isDevelopment } from '@common/utils/startup-app';
import { AxiosService } from '@common/axios';
import { METRICS_ROOT } from '@libs/contracts/api';

import { ProcessorsRootModule } from './processors.root.module';

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
        nestWinstonModuleUtilities.format.nestLike(`Processors: #${instanceId}`, {
            colors: true,
            prettyPrint: true,
            processId: false,
            appName: true,
        }),
    ),
    level: isDevelopment() ? 'debug' : 'http',
});

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(ProcessorsRootModule, {
        logger: WinstonModule.createLogger({
            instance: logger,
        }),
    });

    app.useGlobalFilters(new NotFoundExceptionFilter());

    app.useGlobalGuards(new WorkerRoutesGuard({ allowedPaths: [METRICS_ROOT] }));

    app.enableShutdownHooks();

    await app.init();

    const axiosService = app.get(AxiosService);
    await axiosService.setJwt();
}
void bootstrap();
