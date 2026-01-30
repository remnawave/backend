import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'node:path';

export default defineConfig({
    schema: path.join('prisma', 'schema.prisma'),
    migrations: {
        path: path.join('prisma', 'migrations'),
        seed: 'node dist/prisma/seed/config.seed.js',
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
