(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
import 'zod/compile';

process.title = 'rw-api';

import { ROOT } from '@contract/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { ZodValidationPipe } from 'nestjs-zod';
import { createLogger } from 'winston';
import * as winston from 'winston';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { TypedConfigService } from '@common/config/app-config/typed-config.service';
import { customLogFilter } from '@common/utils/filter-logs';
import { getDocs, isDevOrDebugLogsEnabled } from '@common/utils/startup-app';
import { registerHttpPipeline } from '@common/utils/startup-app/http-pipeline';

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
        bodyParser: false,
    });

    app.disable('x-powered-by');

    const config = app.get(TypedConfigService);

    registerHttpPipeline(app);

    app.setGlobalPrefix(ROOT);

    await getDocs(app);

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
