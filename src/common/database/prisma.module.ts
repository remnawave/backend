import { NestJsPrismaKyselyModule } from '@kastov/nestjs-prisma-kysely';
import { CamelCasePlugin } from 'kysely';

import { PrismaClient } from '@generated/prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TxKyselyService } from './tx-kysely.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
    imports: [
        ConfigModule,
        NestJsPrismaKyselyModule.forRoot({
            transactionHostToken: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
            plugins: [new CamelCasePlugin()],
            // log: 'query',
        }),
    ],
    providers: [PrismaService, TxKyselyService],
    exports: [PrismaService, TxKyselyService],
})
export class PrismaModule {}
