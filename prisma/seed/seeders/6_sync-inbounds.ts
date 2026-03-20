import { Prisma, PrismaClient } from '@prisma/client';
import isEqual from 'lodash/isEqual';
import consola from 'consola';

import { XRayConfig } from '@common/helpers/xray-config';

export async function syncInbounds(prisma: PrismaClient) {
    consola.start('Syncing inbounds...');

    const configProfiles = await prisma.configProfiles.findMany();

    for (const configProfile of configProfiles) {
        consola.start(`Syncing ${configProfile.name}...`);

        const validatedConfig = new XRayConfig(configProfile.config as object);

        const configInbounds = validatedConfig.getAllInbounds();

        const existingInbounds = await prisma.configProfileInbounds.findMany({
            where: {
                profileUuid: configProfile.uuid,
            },
        });

        const inboundsToRemove = existingInbounds.filter((existingInbound) => {
            const configInbound = configInbounds.find((ci) => ci.tag === existingInbound.tag);
            return !configInbound || configInbound.type !== existingInbound.type;
        });

        const inboundsToAdd = configInbounds.filter((configInbound) => {
            if (!existingInbounds) {
                return true;
                // TODO: need additional checks
            }

            const existingInbound = existingInbounds.find((ei) => ei.tag === configInbound.tag);
            return !existingInbound || existingInbound.type !== configInbound.type;
        });

        if (inboundsToRemove.length) {
            const tagsToRemove = inboundsToRemove.map((inbound) => inbound.tag);
            consola.info(`Removing inbounds: ${tagsToRemove.join(', ')}`);

            await prisma.configProfileInbounds.deleteMany({
                where: { uuid: { in: inboundsToRemove.map((inbound) => inbound.uuid) } },
            });
        }

        if (inboundsToAdd.length) {
            consola.info(`Adding inbounds: ${inboundsToAdd.map((i) => i.tag).join(', ')}`);
            await prisma.configProfileInbounds.createMany({
                data: inboundsToAdd.map((inbound) => ({
                    ...inbound,
                    rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
                    profileUuid: configProfile.uuid,
                })),
            });
        }

        if (inboundsToAdd.length === 0 && inboundsToRemove.length === 0) {
            const inboundsToUpdate = configInbounds
                .filter((configInbound) => {
                    if (!existingInbounds) {
                        return false;
                    }

                    const existingInbound = existingInbounds.find(
                        (ei) => ei.tag === configInbound.tag,
                    );

                    if (!existingInbound) {
                        return false;
                    }

                    const securityChanged = configInbound.security !== existingInbound.security;
                    const networkChanged = configInbound.network !== existingInbound.network;
                    const typeChanged = configInbound.type !== existingInbound.type;
                    const portChanged = configInbound.port !== existingInbound.port;
                    const rawInboundChanged = !isEqual(
                        configInbound.rawInbound,
                        existingInbound.rawInbound,
                    );

                    return (
                        securityChanged ||
                        networkChanged ||
                        typeChanged ||
                        portChanged ||
                        rawInboundChanged
                    );
                })
                .map((configInbound) => {
                    const existingInbound = existingInbounds.find(
                        (ei) => ei.tag === configInbound.tag,
                    );

                    if (!existingInbound) {
                        throw new Error(`Inbound with tag ${configInbound.tag} not found`);
                    }

                    existingInbound.security = configInbound.security;
                    existingInbound.network = configInbound.network;
                    existingInbound.type = configInbound.type;
                    existingInbound.port = configInbound.port;
                    existingInbound.rawInbound = configInbound.rawInbound;

                    return existingInbound;
                });

            if (inboundsToUpdate.length) {
                consola.info(`Updating inbounds: ${inboundsToUpdate.map((i) => i.tag).join(', ')}`);

                for (const inbound of inboundsToUpdate) {
                    await prisma.configProfileInbounds.update({
                        where: { uuid: inbound.uuid },
                        data: {
                            ...inbound,
                            rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
                        },
                    });
                }
            }
        }
    }

    consola.success('Inbounds synced successfully');
}
