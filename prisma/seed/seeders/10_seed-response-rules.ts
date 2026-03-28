import { PrismaClient } from '@prisma/client';
import { hasher } from 'node-object-hash';
import consola from 'consola';

import { SRR_DEFAULT_CONFIG, PREV_SRR_CONFIG_HASH } from '../default';

const hash = hasher({
    trim: true,
    sort: {
        array: false,
        object: true,
    },
}).hash;

export async function seedResponseRules(prisma: PrismaClient) {
    const existingConfig = await prisma.subscriptionSettings.findFirst();

    if (!existingConfig) {
        consola.error('Subscription settings not found');
        process.exit(1);
    }

    if (existingConfig.responseRules === null) {
        consola.info('No response rules found, seeding defaults...');
        await prisma.subscriptionSettings.update({
            where: { uuid: existingConfig.uuid },
            data: { responseRules: SRR_DEFAULT_CONFIG },
        });

        consola.success('Default response rules seeded');
        return;
    }

    consola.info('Existing SRR hash:', hash(existingConfig.responseRules));
    consola.info('Default SRR hash:', hash(SRR_DEFAULT_CONFIG));
    consola.info('Previous SRR hash:', PREV_SRR_CONFIG_HASH);

    if (PREV_SRR_CONFIG_HASH === hash(existingConfig.responseRules)) {
        consola.info('User have old default response rules... is default one is newer?');
        if (PREV_SRR_CONFIG_HASH !== hash(SRR_DEFAULT_CONFIG)) {
            consola.info(
                'Default response rules have been changed... updating to new default response rules...',
            );
            await prisma.subscriptionSettings.update({
                where: { uuid: existingConfig.uuid },
                data: { responseRules: SRR_DEFAULT_CONFIG },
            });
        }
    }

    consola.success('Response rules seeded');
}
