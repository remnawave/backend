import { PrismaClient } from '@prisma/client';
import consola from 'consola';

import { CustomRemarksSchema, TCustomRemarks } from '@libs/contracts/models';

import { DEFAULT_HWID_SETTINGS } from '../default';

export async function seedSubscriptionSettings(prisma: PrismaClient) {
    consola.start('Seeding subscription settings...');

    const customRemarks = {
        expiredUsers: ['⌛ Subscription expired', 'Contact support'],
        limitedUsers: ['🚧 Subscription limited', 'Contact support'],
        disabledUsers: ['🚫 Subscription disabled', 'Contact support'],
        emptyHosts: [
            '→ Remnawave',
            '→ No hosts found',
            '→ Check Hosts tab',
            '→ Check Internal Squads tab',
        ],
        HWIDMaxDevicesExceeded: ['Limit of devices reached'],
        HWIDNotSupported: ['App not supported'],
    } satisfies TCustomRemarks;

    const existingConfig = await prisma.subscriptionSettings.findFirst();

    if (existingConfig) {
        if (existingConfig.hwidSettings === null) {
            await prisma.subscriptionSettings.update({
                where: { uuid: existingConfig.uuid },
                data: { hwidSettings: DEFAULT_HWID_SETTINGS },
            });

            consola.success('Default HWID Settings have been seeded');
        }

        if (existingConfig.customRemarks) {
            const existingRemarks = existingConfig.customRemarks as Partial<TCustomRemarks>;

            const needsUpdate =
                !('HWIDMaxDevicesExceeded' in existingRemarks) ||
                !('HWIDNotSupported' in existingRemarks);

            if (needsUpdate) {
                const mergedRemarks: TCustomRemarks = {
                    ...customRemarks,
                    ...existingRemarks,
                };

                await prisma.subscriptionSettings.update({
                    where: { uuid: existingConfig.uuid },
                    data: { customRemarks: mergedRemarks },
                });

                consola.success('Custom remarks updated with new fields');

                return;
            }

            const isValid = await CustomRemarksSchema.safeParseAsync(existingConfig.customRemarks);
            if (!isValid.success) {
                await prisma.subscriptionSettings.update({
                    where: { uuid: existingConfig.uuid },
                    data: { customRemarks: customRemarks },
                });

                consola.success('Custom remarks updated');
                return;
            }
        }

        consola.success('Custom remarks seeded');
        return;
    }

    await prisma.subscriptionSettings.create({
        data: {
            uuid: '00000000-0000-0000-0000-000000000000',
            profileTitle: 'Remnawave',
            supportLink: 'https://dummy.docs.rw',
            profileUpdateInterval: 12,
            isProfileWebpageUrlEnabled: true,
            serveJsonAtBaseSubscription: false,
            randomizeHosts: false,
            hwidSettings: DEFAULT_HWID_SETTINGS,
            isShowCustomRemarks: true,
            customRemarks,
        },
    });
}
