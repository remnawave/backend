process.env.DATABASE_URL = 'postgresql://postgres:postgres@remnawave-db:5432/postgres';
process.env.JWT_AUTH_SECRET = 'mock';
process.env.JWT_API_TOKENS_SECRET = 'mock';
process.env.FRONT_END_DOMAIN = 'mock';
process.env.METRICS_USER = 'mock';
process.env.METRICS_PASS = 'mock';
process.env.SUB_PUBLIC_DOMAIN = 'mock';
process.env.IS_DOCS_ENABLED = 'true';
process.env.NODE_ENV = 'development';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.INSTANCE_TYPE = 'api';

import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import { createLogger } from 'winston';
import * as winston from 'winston';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

import { ROOT } from '@contract/api';

import { NestFactory } from '@nestjs/core';

import { ghActionsDocs } from '@common/utils/startup-app/gh-actions-docs';
import { isDevelopment } from '@common/utils/startup-app';

import { AppModule } from '../../app.module';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

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

const logger = createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('', {
            colors: true,
            prettyPrint: true,
            processId: true,
            appName: false,
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

    ghActionsDocs(app);

    app.setGlobalPrefix(ROOT);

    app.useGlobalPipes(new ZodValidationPipe());

    app.enableShutdownHooks();

    await app.init();
}
bootstrap().catch(() => {
    process.exit(0);
});
