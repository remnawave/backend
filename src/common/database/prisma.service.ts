import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@generated/prisma/client';

import { Injectable, OnModuleInit } from '@nestjs/common';

import { parsePrismaConnectionParams } from './prisma.utils';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const connectionString = process.env.DATABASE_URL!;
        const poolConfig = parsePrismaConnectionParams(connectionString);

        const adapter = new PrismaPg({
            connectionString,
            ...poolConfig,
        });
        super({
            // log: ['query'],
            adapter,
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
}
