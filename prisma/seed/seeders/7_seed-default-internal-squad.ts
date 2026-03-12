import { PrismaClient } from '@prisma/client';
import consola from 'consola';

export async function seedDefaultInternalSquad(prisma: PrismaClient) {
    const existingInternalSquad = await prisma.internalSquads.findFirst();
    const existingConfigProfile = await prisma.configProfiles.findFirst();

    if (!existingConfigProfile) {
        consola.error('Default config profile not found');
        process.exit(1);
    }

    if (existingInternalSquad) {
        consola.info('Default internal squad already exists');
        return;
    }

    const configProfileInbounds = await prisma.configProfileInbounds.findMany({
        where: {
            profileUuid: existingConfigProfile.uuid,
        },
    });

    if (configProfileInbounds.length === 0) {
        consola.error('No config profile inbounds found');
        process.exit(1);
    }

    const res = await prisma.internalSquads.create({
        data: {
            name: 'Default-Squad',
            uuid: '00000000-0000-0000-0000-000000000000',
            internalSquadInbounds: {
                create: configProfileInbounds.map((inbound) => ({
                    inboundUuid: inbound.uuid,
                })),
            },
        },
    });

    if (!res) {
        consola.error('Failed to create default internal squad');
        process.exit(1);
    }

    consola.success('Default internal squad seeded');
}
