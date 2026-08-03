import { PrismaClient } from '@prisma/client';
import consola from 'consola';
import z from 'zod';

// old scope → new
const SCOPE_MIGRATION_MAP: [string, string][] = [
    ['ip-control:*', 'connections:*'],
    ['ip-control:read', 'connections:read'],
    ['ip-control:write', 'connections:write'],
    ['ip-control:fetch-ips-result', 'connections:by-user-result'],
    ['ip-control:fetch-ips', 'connections:by-user'],
    ['ip-control:fetch-users-ips', 'connections:by-node'],
    ['ip-control:fetch-users-ips-result', 'connections:by-node-result'],
    ['ip-control:drop-connections', 'connections:drop'],
    ['users:by-uuid', 'users:by-id'],
    ['subscriptions:by-uuid', 'subscriptions:by-id'],
];

const uuidSchema = z.uuid();

export async function migrateScopes(prisma: PrismaClient) {
    const allTokens = await prisma.apiTokens.findMany();
    if (allTokens.length > 0) {
        for (const token of allTokens) {
            const uuid = uuidSchema.safeParse(token.uuid);
            if (!uuid.success) {
                consola.warn(
                    `Invalid UUID for API token "${token.name}": ${token.uuid}. Deleting token...`,
                );

                await prisma.apiTokens.delete({
                    where: { uuid: token.uuid },
                });
            }
        }
    }

    const migrationMap = new Map(SCOPE_MIGRATION_MAP);
    const legacyScopes = SCOPE_MIGRATION_MAP.map(([oldScope]) => oldScope);

    const tokens = await prisma.apiTokens.findMany({
        where: { scopes: { hasSome: legacyScopes } },
    });

    if (tokens.length === 0) {
        return;
    }

    for (const token of tokens) {
        const migratedScopes = [
            ...new Set(token.scopes.map((scope) => migrationMap.get(scope) ?? scope)),
        ];

        await prisma.apiTokens.update({
            where: { uuid: token.uuid },
            data: { scopes: migratedScopes },
        });

        consola.info(`Migrated legacy scopes for API token "${token.name}"`);
    }

    consola.success(`Migrated legacy scopes on ${tokens.length} API token(s)`);
}
