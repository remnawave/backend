import { PrismaClient } from '@prisma/client';
import consola from 'consola';

import {
    SUBPAGE_DEFAULT_CONFIG_NAME,
    SUBPAGE_DEFAULT_CONFIG_UUID,
} from '@libs/subscription-page/constants';
import { SubscriptionPageRawConfigSchema } from '@libs/subscription-page/models';

import { DEFAULT_SUBPAGE_CONFIG } from '@modules/subscription-page-configs/constants';

export async function seedSubscriptionPageConfig(prisma: PrismaClient) {
    const existingConfig = await prisma.subscriptionPageConfig.findUnique({
        where: {
            uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
        },
    });

    if (!existingConfig) {
        await prisma.subscriptionPageConfig.create({
            data: {
                uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
                name: SUBPAGE_DEFAULT_CONFIG_NAME,
                config: DEFAULT_SUBPAGE_CONFIG,
            },
        });

        consola.success('Subscription page config seeded');

        return;
    } else {
        consola.start('Validating subpage configs...');

        const configList = await prisma.subscriptionPageConfig.findMany();

        for (const config of configList) {
            const validationResult = await SubscriptionPageRawConfigSchema.safeParseAsync(
                config.config,
            );

            if (!validationResult.success) {
                consola.warn(`Invalid subpage config: ${config.name} will be deleted`);
                await prisma.subscriptionPageConfig.delete({
                    where: { uuid: config.uuid },
                });
            } else {
                await prisma.subscriptionPageConfig.update({
                    where: { uuid: config.uuid },
                    data: { config: validationResult.data },
                });
                consola.info(`Valid subpage config: ${config.name} updated`);
            }
        }

        const existingConfig = await prisma.subscriptionPageConfig.findUnique({
            where: {
                uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
            },
        });

        if (!existingConfig) {
            await prisma.subscriptionPageConfig.create({
                data: {
                    uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
                    name: SUBPAGE_DEFAULT_CONFIG_NAME,
                    config: DEFAULT_SUBPAGE_CONFIG,
                },
            });
        }

        consola.success('Subpage configs validated');
    }
}
