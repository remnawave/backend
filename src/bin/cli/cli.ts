#!/usr/bin/env node

import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import {
    generateHybridIdentity,
    generateX25519Identity,
    identityToRecipient,
} from 'age-encryption';
import consola from 'consola';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Redis from 'ioredis';

import { getRedisConnectionOptions } from '@common/utils';
import { generateNodeCert } from '@common/utils/certs';
import { encodeCertPayload } from '@common/utils/certs/encode-node-payload';
import { CACHE_KEYS } from '@libs/contracts/constants';

import { TResponseRuleEncryption } from '@modules/subscription-response-rules/types/response-rules.types';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const redisOptions = getRedisConnectionOptions(
    process.env.REDIS_SOCKET,
    process.env.REDIS_HOST,
    process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    'ioredis',
);

const redis = new Redis({
    ...redisOptions,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    db: parseInt(process.env.REDIS_DB ?? '1'),
    keyPrefix: 'rmnwv:',
});

const enum CLI_ACTIONS {
    DELETE_USERS_USAGE_BY_DATE_RANGE = 'delete-users-usage-by-date-range',
    ENABLE_PASSWORD_AUTH = 'enable-password-auth',
    EXIT = 'exit',
    GENERATE_ENCRYPTION_KEYS = 'generate-encryption-keys',
    GET_SECRET_KEY_FOR_NODE = 'get-secret-key-for-node',
    RESET_CERTS = 'reset-certs',
    RESET_SUPERADMIN = 'reset-superadmin',
    TRUNCATE_HWID_USER_DEVICES = 'truncate-hwid-user-devices',
    TRUNCATE_SRH_TABLE = 'truncate-srh-table',
    TRUNCATE_USERS_USAGE_TABLE = 'truncate-users-usage-table',
}

const DATE_INPUT_FORMAT = 'DD-MM-YYYY';

async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        consola.error('❌ Database connection error:', error);
        return false;
    }
}

async function checkRedisConnection() {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        consola.error('❌ Redis connection error:', error);
        return false;
    }
}

async function resetSuperadmin() {
    const answer = await consola.prompt('Are you sure you want to reset the superadmin?', {
        type: 'confirm',
        required: true,
    });

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    consola.start('🔄 Reseting superadmin...');

    const superadmin = await prisma.admin.findFirst();

    if (!superadmin) {
        consola.error('❌ Superadmin not found.');
        process.exit(1);
    }

    try {
        await prisma.admin.delete({
            where: {
                uuid: superadmin.uuid,
            },
        });

        await redis.del(CACHE_KEYS.REMNAWAVE_SETTINGS);

        consola.success(
            `✅ Superadmin ${superadmin.username} was reset successfully. Please open the login page and set a new one.`,
        );
    } catch (error) {
        consola.error('❌ Failed to reset superadmin:', error);
        process.exit(1);
    }
}

async function resetCerts() {
    const answer = await consola.prompt(
        'Are you sure you want to delete the certs? You will need to add new certs to all nodes again.',
        {
            type: 'confirm',
            required: true,
        },
    );

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    consola.start('🔄 Deleting certs...');

    const keygen = await prisma.keygen.findFirst();

    if (!keygen) {
        consola.error('❌ Certs not found.');
        process.exit(1);
    }

    try {
        await prisma.keygen.delete({
            where: {
                uuid: keygen.uuid,
            },
        });
        consola.success(`✅ Certs deleted successfully.`);
        consola.warn(
            `Restart Remnawave to apply changes by running "docker compose down && docker compose up -d".`,
        );
    } catch (error) {
        consola.error('❌ Failed to reset certs:', error);
        process.exit(1);
    }
}

async function getSecretKeyForNode() {
    consola.start('🔑 Getting SECRET_KEY for node...');

    try {
        const keygen = await prisma.keygen.findFirst();

        if (!keygen) {
            consola.error('❌ Keygen not found. Reset SECRET_KEY first or restart Remnawave.');
            process.exit(1);
        }

        if (!keygen.caCert || !keygen.caKey) {
            consola.error('❌ Certs not found. Reset SECRET_KEY first or restart Remnawave.');
            process.exit(1);
        }

        const { nodeCertPem, nodeKeyPem } = await generateNodeCert(keygen.caCert, keygen.caKey);

        const nodePayload = encodeCertPayload({
            nodeCertPem,
            nodeKeyPem,
            caCertPem: keygen.caCert,
            jwtPublicKey: keygen.pubKey,
        });

        consola.success('✅ SECRET_KEY for node generated successfully.');

        consola.info(`\nSECRET_KEY="${nodePayload}"`);

        process.exit(0);
    } catch (error) {
        consola.error('❌ Failed to get SECRET_KEY for node:', error);
        process.exit(1);
    }
}

async function enablePasswordAuth() {
    consola.start('🔄 Enabling password authentication...');

    const answer = await consola.prompt(
        'Are you sure you want to enable password authentication?',
        {
            type: 'confirm',
            required: true,
        },
    );

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    try {
        await prisma.remnawaveSettings.update({
            where: { id: 1 },
            data: {
                passwordSettings: {
                    enabled: true,
                },
            },
        });

        await redis.del(CACHE_KEYS.REMNAWAVE_SETTINGS);

        consola.success('✅ Password authentication enabled successfully.');
        process.exit(0);
    } catch (error) {
        consola.error('❌ Failed to enable password authentication:', error);
        process.exit(1);
    }
}

async function truncateHwidUserDevices() {
    consola.start('🔄 Cleaning up HWID Devices...');

    const answer = await consola.prompt('Are you sure you want to clean up HWID Devices?', {
        type: 'confirm',
        required: true,
    });

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    try {
        await prisma.$executeRaw`TRUNCATE hwid_user_devices;`;
        consola.success('✅ HWID Devices cleaned up successfully.');
        process.exit(0);
    } catch (error) {
        consola.error('❌ Failed to clean up HWID Devices:', error);
        process.exit(1);
    }
}

async function truncateSrhTable() {
    consola.start('🔄 Cleaning up SRH Table...');

    const answer = await consola.prompt('Are you sure you want to clean up SRH Table?', {
        type: 'confirm',
        required: true,
    });

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    try {
        await prisma.$executeRaw`TRUNCATE user_subscription_request_history RESTART IDENTITY;`;
        consola.success('✅ SRH Table cleaned up successfully.');
        process.exit(0);
    } catch (error) {
        consola.error('❌ Failed to clean up SRH Table:', error);
        process.exit(1);
    }
}

async function truncateUsersUsageTable() {
    consola.start('🔄 Cleaning up Users Usage Table...');

    const answer = await consola.prompt('Are you sure you want to clean up Users Usage Table?', {
        type: 'confirm',
        required: true,
    });

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    try {
        await prisma.$executeRaw`TRUNCATE nodes_user_usage_history RESTART IDENTITY;`;
        await prisma.$executeRaw`VACUUM nodes_user_usage_history;`;
        await prisma.$executeRaw`REINDEX TABLE nodes_user_usage_history;`;
        consola.success('✅ Users Usage Table cleaned up successfully.');
        process.exit(0);
    } catch (error) {
        consola.error('❌ Failed to clean up Users Usage Table:', error);
        process.exit(1);
    }
}

type DeleteMethod = 'batched' | 'single';

async function promptStrictDate(label: string, example: string): Promise<dayjs.Dayjs> {
    const input = await consola.prompt(
        `Enter the ${label} date in strict format day-month-year (${DATE_INPUT_FORMAT}), e.g. ${example}:`,
        {
            type: 'text',
            placeholder: DATE_INPUT_FORMAT,
            required: true,
        },
    );

    const date = dayjs(input, DATE_INPUT_FORMAT, true);
    if (!date.isValid()) {
        consola.error(
            `❌ Invalid ${label} date. Expected strict format ${DATE_INPUT_FORMAT}, e.g. ${example}.`,
        );
        process.exit(1);
    }

    return date;
}

function renderDeleteProgress(
    current: number,
    total: number,
    startedAt: number,
    lastBatchMs: number,
): void {
    const ratio = total > 0 ? Math.min(current / total, 1) : 1;
    const width = 28;
    const filled = Math.round(ratio * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    const pct = `${(ratio * 100).toFixed(1)}%`.padStart(6);

    const elapsedMs = Date.now() - startedAt;
    const elapsedSec = (elapsedMs / 1000).toFixed(1);
    const etaSec =
        current > 0 ? (((elapsedMs / current) * (total - current)) / 1000).toFixed(1) : '—';

    const line =
        `  [${bar}] ${pct}  ` +
        `${current.toLocaleString('en-US')}/${total.toLocaleString('en-US')}  ` +
        `| ${elapsedSec}s elapsed | ETA ${etaSec}s | last ${lastBatchMs}ms | do NOT close`;

    if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(line);
    } else {
        consola.log(line.trim());
    }
}

async function runBatchedDelete(
    startStr: string,
    endStr: string,
    batchSize: number,
    totalToDelete: number,
    startedAt: number,
): Promise<number> {
    let totalDeleted = 0;
    const timings: number[] = [];

    consola.start('🔄 Deleting records in batches... (do NOT close this window)');

    for (;;) {
        const batchStart = Date.now();
        const deleted = await prisma.$executeRaw`
            DELETE FROM nodes_user_usage_history
            WHERE ctid IN (
                SELECT ctid
                FROM nodes_user_usage_history
                WHERE created_at >= ${startStr}::date
                  AND created_at <= ${endStr}::date
                LIMIT ${batchSize}
            )
        `;
        const batchMs = Date.now() - batchStart;

        if (deleted === 0) {
            break;
        }

        totalDeleted += deleted;
        timings.push(batchMs);

        renderDeleteProgress(totalDeleted, totalToDelete, startedAt, batchMs);
    }

    if (process.stdout.isTTY) {
        process.stdout.write('\n');
    }

    if (timings.length > 0) {
        const first = timings[0];
        const last = timings[timings.length - 1];
        const min = Math.min(...timings);
        const max = Math.max(...timings);
        const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);

        consola.box(
            `Batched delete summary\n` +
                `batches:            ${timings.length}\n` +
                `batch size:         ${batchSize.toLocaleString('en-US')}\n` +
                `deleted total:      ${totalDeleted.toLocaleString('en-US')}\n` +
                `first / avg / last: ${first} / ${avg} / ${last} ms\n` +
                `min / max:          ${min} / ${max} ms`,
        );
    }

    return totalDeleted;
}

async function runSingleDelete(startStr: string, endStr: string): Promise<number> {
    consola.start('🔄 Deleting records... (do NOT close this window)');

    const deleted = await prisma.$executeRaw`
        DELETE FROM nodes_user_usage_history
        WHERE created_at >= ${startStr}::date
          AND created_at <= ${endStr}::date
    `;

    consola.success(`✅ Deleted ${deleted.toLocaleString('en-US')} record(s).`);

    return deleted;
}

async function deleteUsersUsageByDateRange() {
    consola.info(
        'This will permanently delete users traffic statistics (nodes_user_usage_history) for the selected date range.',
    );

    const method = (await consola.prompt('Select deletion method', {
        type: 'select',
        required: true,
        options: [
            {
                value: 'single',
                label: 'Single query (fast)',
                hint: 'One DELETE — fastest overall, but holds one longer lock',
            },
            {
                value: 'batched',
                label: 'Batched (low-lock + progress bar)',
                hint: 'Many small DELETEs — shorter locks, live progress, slower overall',
            },
        ],
        initial: 'single',
    })) as DeleteMethod;

    const startDate = await promptStrictDate('START', '01-01-2024');
    const endDate = await promptStrictDate('END', '31-12-2024');

    if (endDate.isBefore(startDate)) {
        consola.error('❌ END date can not be earlier than START date.');
        process.exit(1);
    }

    let batchSize = 0;
    if (method === 'batched') {
        const batchSizeInput = await consola.prompt('Batch size (rows per DELETE):', {
            type: 'text',
            placeholder: '50000',
            default: '50000',
            required: true,
        });

        batchSize = Number.parseInt(batchSizeInput, 10);
        if (!Number.isInteger(batchSize) || batchSize <= 0) {
            consola.error('❌ Invalid batch size. Expected a positive integer.');
            process.exit(1);
        }
    }

    const startStr = startDate.format('YYYY-MM-DD');
    const endStr = endDate.format('YYYY-MM-DD');

    consola.start('🔍 Counting affected rows...');

    let rowsToDelete = 0n;
    try {
        const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM nodes_user_usage_history
            WHERE created_at >= ${startStr}::date
              AND created_at <= ${endStr}::date
        `;
        rowsToDelete = countResult[0]?.count ?? 0n;
    } catch (error) {
        consola.error('❌ Failed to count rows:', error);
        process.exit(1);
    }

    if (rowsToDelete === 0n) {
        consola.info(
            `ℹ️ No records found between ${startStr} and ${endStr} (inclusive). Nothing to delete.`,
        );
        process.exit(0);
    }

    consola.box(
        `About to delete ${rowsToDelete.toLocaleString('en-US')} record(s)\n` +
            `from ${startStr} to ${endStr} (inclusive)\n` +
            `from table "nodes_user_usage_history" ` +
            (method === 'batched'
                ? `in batches of ${batchSize.toLocaleString('en-US')}.`
                : `in a single query.`),
    );

    consola.warn(
        'Do NOT close this window until the operation is finished.\n' +
            'A final VACUUM runs at the end to reclaim space.\n' +
            'Interrupting the operation may leave the table bloated.',
    );

    const answer = await consola.prompt(
        `Are you sure you want to permanently delete these ${rowsToDelete.toLocaleString('en-US')} record(s)?`,
        {
            type: 'confirm',
            required: true,
        },
    );

    if (!answer) {
        consola.error('❌ Aborted.');
        process.exit(1);
    }

    const startedAt = Date.now();
    let totalDeleted = 0;

    try {
        totalDeleted =
            method === 'batched'
                ? await runBatchedDelete(
                      startStr,
                      endStr,
                      batchSize,
                      Number(rowsToDelete),
                      startedAt,
                  )
                : await runSingleDelete(startStr, endStr);
    } catch (error) {
        if (process.stdout.isTTY) {
            process.stdout.write('\n');
        }
        consola.error('❌ Failed to delete records:', error);
        process.exit(1);
    }

    consola.start('🧹 Reclaiming space (VACUUM)... (do NOT close this window)');
    try {
        await prisma.$executeRaw`VACUUM nodes_user_usage_history;`;
    } catch (error) {
        consola.warn('⚠️ Final VACUUM failed (table left as-is):', error);
    }

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    consola.success(
        `✅ Done in ${elapsedSec}s. Removed ${totalDeleted.toLocaleString('en-US')} record(s) from ${startStr} to ${endStr}.`,
    );
    process.exit(0);
}

async function generateEncryptionKeys() {
    const method = (await consola.prompt('Select encryption method', {
        type: 'select',
        required: true,
        options: [
            {
                value: 'age1',
                label: 'age1 (X25519)',
                hint: 'Native X25519 — classical security',
            },
            {
                value: 'age1pq1',
                label: 'age1pq1 (hybrid post-quantum)',
                hint: 'X25519 + ML-KEM-768 — post-quantum resistant',
            },
        ],
        initial: 'age1',
    })) as TResponseRuleEncryption['method'];

    consola.start(`🔑 Generating ${method} key pair...`);

    try {
        let identity: string;

        switch (method) {
            case 'age1':
                identity = await generateX25519Identity();
                break;
            case 'age1pq1':
                identity = await generateHybridIdentity();
                break;
            default: {
                const exhaustiveCheck: never = method;
                throw new Error(`Unsupported encryption method: ${exhaustiveCheck}`);
            }
        }

        const recipient = await identityToRecipient(identity);

        consola.success(`✅ ${method} key pair generated successfully.`);

        consola.info(
            `\nPUBLIC KEY (recipient) — put this into the response rule "encryption.key":\n${recipient}`,
        );
        consola.info(
            `\nPRIVATE KEY (identity) — keep it secret, the client uses it to decrypt the response:\n${identity}`,
        );

        process.exit(0);
    } catch (error) {
        consola.error('❌ Failed to generate key pair:', error);
        process.exit(1);
    }
}

async function main() {
    consola.box('Remnawave Rescue CLI v0.4');

    consola.start('🌱 Checking database connection...');
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
        consola.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    consola.success('✅ Database connected!');

    consola.start('🌱 Checking Redis connection...');
    const isRedisConnected = await checkRedisConnection();
    if (!isRedisConnected) {
        consola.error('❌ Failed to connect to Redis. Exiting...');
        process.exit(1);
    }
    consola.success('✅ Redis connected!');

    const action = await consola.prompt('Select an action', {
        type: 'select',
        required: true,
        options: [
            {
                value: CLI_ACTIONS.RESET_SUPERADMIN,
                label: 'Reset superadmin',
                hint: 'Fully reset superadmin',
            },
            {
                value: CLI_ACTIONS.ENABLE_PASSWORD_AUTH,
                label: 'Enable password authentication',
                hint: 'Enable password authentication',
            },
            {
                value: CLI_ACTIONS.GENERATE_ENCRYPTION_KEYS,
                label: 'Generate keypairs',
                hint: 'Generate keypairs for response rules encryption',
            },
            {
                value: CLI_ACTIONS.TRUNCATE_HWID_USER_DEVICES,
                label: 'Clean up HWID Devices',
                hint: 'Remove all HWID Devices from the database',
            },
            {
                value: CLI_ACTIONS.TRUNCATE_SRH_TABLE,
                label: 'Clean up SRH Table',
                hint: 'Remove all SRH data from the database',
            },
            {
                value: CLI_ACTIONS.TRUNCATE_USERS_USAGE_TABLE,
                label: 'Clean up Users Usage Table',
                hint: 'Remove all users traffic statistics data from the database',
            },
            {
                value: CLI_ACTIONS.DELETE_USERS_USAGE_BY_DATE_RANGE,
                label: 'Delete Users Usage by date range',
                hint: 'Remove traffic statistics for a period (day-month-year); choose single or batched',
            },
            {
                value: CLI_ACTIONS.RESET_CERTS,
                label: 'Reset certs',
                hint: 'Fully reset certs',
            },
            {
                value: CLI_ACTIONS.GET_SECRET_KEY_FOR_NODE,
                label: 'Get SECRET_KEY for a Remnawave Node',
                hint: 'Get SECRET_KEY in cases, where you can not get from Panel',
            },
            {
                value: CLI_ACTIONS.EXIT,
                label: 'Exit',
            },
        ],
        initial: CLI_ACTIONS.EXIT,
    });

    switch (action) {
        case CLI_ACTIONS.RESET_SUPERADMIN:
            await resetSuperadmin();
            break;
        case CLI_ACTIONS.RESET_CERTS:
            await resetCerts();
            break;
        case CLI_ACTIONS.GET_SECRET_KEY_FOR_NODE:
            await getSecretKeyForNode();
            break;
        case CLI_ACTIONS.GENERATE_ENCRYPTION_KEYS:
            await generateEncryptionKeys();
            break;
        case CLI_ACTIONS.ENABLE_PASSWORD_AUTH:
            await enablePasswordAuth();
            break;
        case CLI_ACTIONS.TRUNCATE_HWID_USER_DEVICES:
            await truncateHwidUserDevices();
            break;
        case CLI_ACTIONS.TRUNCATE_SRH_TABLE:
            await truncateSrhTable();
            break;
        case CLI_ACTIONS.TRUNCATE_USERS_USAGE_TABLE:
            await truncateUsersUsageTable();
            break;
        case CLI_ACTIONS.DELETE_USERS_USAGE_BY_DATE_RANGE:
            await deleteUsersUsageByDateRange();
            break;
        case CLI_ACTIONS.EXIT:
            consola.info('👋 Exiting...');
            process.exit(0);
    }
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        consola.error('❌ An error occurred:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
