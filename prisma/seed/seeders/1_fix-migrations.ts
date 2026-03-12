import { PrismaClient } from '@prisma/client';
import consola from 'consola';

export async function fixOldMigrations(prisma: PrismaClient) {
    const migrationsToFix = [
        {
            migrationName: '20250822011918_add_tid',
            oldChecksum: '208f4ab9ad4d538853e2726fcc0c8733b2f5ddccfc80985d69bc2be2ecf017b4',
            newChecksum: '650c47ab960ed73efaf0b1fa7dd484f94b0d626d0c00944a2832431e1ee0a78b',
        },
    ];

    const migrationsToDelete = [
        '20251230045744_drop_is_custom_remark',
        '20260107133400_es_default_remarks',
    ];

    try {
        for (const { migrationName, oldChecksum, newChecksum } of migrationsToFix) {
            const result = await prisma.$executeRaw`
                UPDATE _prisma_migrations 
                SET checksum = ${newChecksum}
                WHERE migration_name = ${migrationName} 
                AND checksum = ${oldChecksum};
            `;
            if (result) {
                consola.info(`Migration "${migrationName}": updated ${result} rows`);
            }
        }

        for (const migrationName of migrationsToDelete) {
            await prisma.$executeRaw`
                DELETE FROM _prisma_migrations 
                WHERE migration_name = ${migrationName};
            `;
        }

        consola.success('Old migrations fixed');
    } catch (error) {
        consola.error('Failed to fix old migrations:', error);
    }
}
