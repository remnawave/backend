import { NestJsPrismaKyselyModule } from '@kastov/nestjs-prisma-kysely';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CustomCamelCasePlugin, JSON_COLUMNS } from './camel-case.plugin';
import { PrismaService } from './prisma.service';
import { TxKyselyService } from './tx-kysely.service';

@Global()
@Module({
    imports: [
        ConfigModule,
        NestJsPrismaKyselyModule.forRoot({
            transactionHostToken: TransactionHost<TransactionalAdapterPrisma>,
            plugins: [new CustomCamelCasePlugin({ excludeColumns: JSON_COLUMNS })],
            // log: 'query',
        }),
    ],
    providers: [PrismaService, TxKyselyService],
    exports: [PrismaService, TxKyselyService],
})
export class PrismaModule {}
