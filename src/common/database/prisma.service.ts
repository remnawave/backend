import { PrismaClient } from '@prisma/client';

// import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleInit } from '@nestjs/common';

const DEFAULT_CONNECTION_LIMIT = 10;
const DEFAULT_POOL_TIMEOUT_SECONDS = 20;

export function buildDatabaseUrl(
    rawUrl: string,
    connectionLimit: number,
    poolTimeoutSeconds: number,
): string {
    const url = new URL(rawUrl);

    if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', String(connectionLimit));
    }
    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', String(poolTimeoutSeconds));
    }

    return url.toString();
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        // const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        const connectionLimit = parseInt(
            process.env.DATABASE_CONNECTION_LIMIT ?? String(DEFAULT_CONNECTION_LIMIT),
            10,
        );
        const poolTimeoutSeconds = parseInt(
            process.env.DATABASE_POOL_TIMEOUT ?? String(DEFAULT_POOL_TIMEOUT_SECONDS),
            10,
        );

        super({
            // log: ['query'],
            // adapter,
            datasourceUrl: buildDatabaseUrl(
                process.env.DATABASE_URL as string,
                connectionLimit,
                poolTimeoutSeconds,
            ),
        });
        // init with config
    }
    async onModuleInit() {
        await this.$connect();
    }

    /**
     * @see https://github.com/eoin-obrien/prisma-extension-kysely
     * @see https://github.com/eoin-obrien/prisma-extension-kysely/issues/71
     */
    // static withKysely(config: ConfigService) {
    //     return new PrismaService(config).$extends(
    //         kyselyExtension({
    //             kysely: () => {
    //                 return new Kysely<DB>({
    //                     log: ['query'],
    //                     dialect: {
    //                         createDriver: () => new DummyDriver(),
    //                         createAdapter: () => new PostgresAdapter(),
    //                         createIntrospector: (db) => new PostgresIntrospector(db),
    //                         createQueryCompiler: () => new PostgresQueryCompiler(),
    //                     },
    //                     plugins: [new CamelCasePlugin()],
    //                 });
    //             },
    //         }),
    //     ) as unknown as PrismaService;
    // }

    /** Don't forget it */
    // declare $kysely: Kysely<DB>;
}
