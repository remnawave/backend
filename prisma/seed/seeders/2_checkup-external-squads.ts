import { PrismaClient } from '@prisma/client';
import consola from 'consola';

export async function checkupExternalSquads(prisma: PrismaClient) {
    consola.start('Checking up external squads...');

    const fields: Array<{ name: string; strictObjectCheck?: boolean }> = [
        { name: 'custom_remarks', strictObjectCheck: true },
        { name: 'hwid_settings', strictObjectCheck: true },
        { name: 'subscription_settings' },
        { name: 'host_overrides' },
        { name: 'response_headers' },
    ];

    let total = 0;

    for (const { name, strictObjectCheck } of fields) {
        const whereClause = strictObjectCheck
            ? `"${name}" IS NOT NULL AND (jsonb_typeof("${name}") != 'object' OR "${name}" = '{}'::jsonb)`
            : `"${name}" IN ('null'::jsonb, '[]'::jsonb)`;

        const result = await prisma.$executeRawUnsafe(`
            UPDATE external_squads
            SET "${name}" = NULL
            WHERE ${whereClause};
        `);
        total += result;
        if (result > 0) consola.info(`"${name}": ${result} rows`);
    }

    consola.success(total > 0 ? `Total: ${total} rows fixed` : 'Nothing to fix');
}
