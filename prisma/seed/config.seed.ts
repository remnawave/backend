import relativeTime from 'dayjs/plugin/relativeTime';
import { PrismaClient } from '@prisma/client';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Redis } from 'ioredis';
import consola from 'consola';
import dayjs from 'dayjs';

import { getRedisConnectionOptions } from '@common/utils';

import {
    checkupExternalSquads,
    fixOldMigrations,
    seedDefaultConfigProfile,
    seedDefaultInternalSquad,
    seedKeygen,
    seedResponseRules,
    seedSubscriptionPageConfig,
    seedSubscriptionSettings,
    seedSubscriptionTemplate,
    syncInbounds,
    verifyAdminUser,
    seedRemnawaveSettings,
} from './seeders';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

const logger = consola;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const SEED_STEPS = [
    { name: 'Fix Old Migrations', fn: fixOldMigrations },
    { name: 'Checkup External Squads', fn: checkupExternalSquads },
    { name: 'Remnawave Settings', fn: seedRemnawaveSettings },
    { name: 'Subscription Templates', fn: seedSubscriptionTemplate },
    { name: 'Default Config Profile', fn: seedDefaultConfigProfile },
    { name: 'Sync Inbounds', fn: syncInbounds },
    { name: 'Default Internal Squad', fn: seedDefaultInternalSquad },
    { name: 'Subscription Settings', fn: seedSubscriptionSettings },
    { name: 'Keygen', fn: seedKeygen },
    { name: 'Response Rules', fn: seedResponseRules },
    { name: 'Subscription Page Config', fn: seedSubscriptionPageConfig },
    { name: 'Verify Admin User', fn: verifyAdminUser },
] as const;

async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        logger.success('Database connected');
        return true;
    } catch (error) {
        logger.error('Database connection error:', error);
        process.exit(1);
    }
}

async function clearRedis() {
    logger.start('Clearing Redis...');

    try {
        const redis = new Redis({
            ...getRedisConnectionOptions(
                process.env.REDIS_SOCKET,
                process.env.REDIS_HOST,
                process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
                'ioredis',
            ),
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            db: parseInt(process.env.REDIS_DB || '1', 10),
            password: process.env.REDIS_PASSWORD || undefined,
        });

        await redis.flushdb();
        await redis.quit();

        logger.success('Redis cleared');
    } catch (error) {
        logger.error('Redis clearing error:', error);
        logger.warn('Continuing without Redis clearing...');
    }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedAll() {
    let isConnected = false;

    while (!isConnected) {
        isConnected = await checkDatabaseConnection();

        if (isConnected) {
            await clearRedis();

            const totalSteps = SEED_STEPS.length;

            for (let i = 0; i < totalSteps; i++) {
                logger.log(`▰▱`.repeat(12));
                const step = SEED_STEPS[i];
                const stepNumber = `[${String(i + 1).padStart(2, '0')}/${totalSteps}]`;
                logger.start(`${stepNumber} ${step.name}`);
                await step.fn(prisma);
                logger.success(`${stepNumber} ${step.name}`);
            }

            break;
        } else {
            logger.info('Failed to connect to database. Retrying in 5 seconds...');
            await delay(5_000);
        }
    }
}

seedAll()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        logger.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
