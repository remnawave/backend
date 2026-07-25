// import { PrismaClient } from '@prisma/client';
// import { Kysely } from 'kysely';

// import { DB } from 'prisma/generated/types';

// declare module '@prisma/client' {
//     interface PrismaClient {
//         $kysely: Kysely<DB>;
//     }
// }

// declare module '@nestjs-cls/transactional-adapter-prisma' {
//     interface TransactionalAdapterPrisma {
//         tx: {
//             $kysely: Kysely<DB>;
//         } & PrismaClient;
//     }
// }

declare module 'parse-prometheus-text-format' {
    function parsePrometheusTextFormat(text: string): any;
    export = parsePrometheusTextFormat;
}

declare module 'zlib' {
    interface ZstdOptions {
        pledgedSrcSize?: number | undefined;
    }
}
