import { PrismaClient } from '@prisma/client';
import consola from 'consola';

import { XRAY_DEFAULT_CONFIG } from '../default';
import { syncInbounds } from './6_sync-inbounds';

export async function seedDefaultConfigProfile(prisma: PrismaClient) {
    consola.start('Seeding default config profile...');

    const existingConfig = await prisma.configProfiles.findFirst();

    if (existingConfig) {
        consola.info('Default config profile already seeded');
        return;
    }

    const config = await prisma.configProfiles.create({
        data: {
            name: 'Default-Profile',
            config: XRAY_DEFAULT_CONFIG,
            uuid: '00000000-0000-0000-0000-000000000000',
        },
    });
    if (!config) {
        consola.error('Failed to create default config profile');
        process.exit(1);
    }

    await syncInbounds(prisma);

    const existingInternalSquad = await prisma.internalSquads.findFirst();

    // workaround for created squad from migration
    if (existingInternalSquad && existingInternalSquad.name === 'Default-Squad') {
        const configProfileInbounds = await prisma.configProfileInbounds.findMany({
            where: {
                profileUuid: config.uuid,
            },
        });

        if (configProfileInbounds.length === 0) {
            consola.info('No config profile inbounds found');
            return;
        }

        const internalSquadInbounds = await prisma.internalSquadInbounds.createMany({
            data: configProfileInbounds.map((inbound) => ({
                inboundUuid: inbound.uuid,
                internalSquadUuid: existingInternalSquad.uuid,
            })),
        });

        if (!internalSquadInbounds) {
            consola.error('Failed to create default internal squad inbounds');
            process.exit(1);
        }

        return;
    }

    consola.success('Default config profile seeded');
}
