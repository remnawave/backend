import 'dotenv/config';
import type { PrismaConfig } from 'prisma';

import { readFileSync } from 'node:fs';
import path from 'node:path';

// Docker secrets: DATABASE_URL_FILE/DIRECT_URL_FILE point to a file holding the value.
// Inlined on purpose, only this file (not src/) is copied into the runtime image.
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const filePath = process.env[`${key}_FILE`];

    if (!filePath) {
        continue;
    }

    if (process.env[key]) {
        throw new Error(`${key} and ${key}_FILE are both set. Remove one of them.`);
    }

    process.env[key] = readFileSync(filePath, 'utf8').replace(/(\r?\n)+$/, '');
}

if (!process.env.DIRECT_URL) {
    // eslint-disable-next-line no-console
    console.log('DIRECT_URL is not set, using DATABASE_URL');
    process.env.DIRECT_URL = process.env.DATABASE_URL;
} else {
    // eslint-disable-next-line no-console
    console.log('DIRECT_URL is set, using DIRECT_URL');
}

export default {
    schema: path.join('prisma', 'schema.prisma'),
    migrations: {
        path: path.join('prisma', 'migrations'),
        seed: 'node dist/seed.js',
    },
} satisfies PrismaConfig;
