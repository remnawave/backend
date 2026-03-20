import { PrismaClient } from '@prisma/client';
import consola from 'consola';

import { generateJwtKeypair, generateMasterCerts } from '@common/utils/certs/generate-certs.util';

import { KeygenEntity } from '@modules/keygen/entities/keygen.entity';

export async function seedKeygen(prisma: PrismaClient) {
    consola.start('Seeding keygen...');

    try {
        await prisma.$transaction(
            async (tx) => {
                const count = await tx.keygen.count();
                consola.info(`Keygen count: ${count}`);

                let createNewKeygen = false;

                if (count > 1) {
                    createNewKeygen = true;

                    consola.info('Deleting old keygen...');

                    await tx.keygen.deleteMany();
                }

                const existingConfig = await tx.keygen.findFirst({
                    orderBy: { createdAt: 'asc' },
                });

                if (!existingConfig) {
                    createNewKeygen = true;
                }

                if (createNewKeygen) {
                    const { publicKey, privateKey } = await generateJwtKeypair();
                    const { caCertPem, caKeyPem, clientCertPem, clientKeyPem } =
                        await generateMasterCerts();

                    const keygenEntity = new KeygenEntity({
                        caCert: caCertPem,
                        caKey: caKeyPem,
                        clientCert: clientCertPem,
                        clientKey: clientKeyPem,
                        pubKey: publicKey,
                        privKey: privateKey,
                    });

                    return await tx.keygen.create({
                        data: keygenEntity,
                    });
                }

                if (
                    existingConfig &&
                    existingConfig.pubKey &&
                    existingConfig.privKey &&
                    (!existingConfig.caCert ||
                        !existingConfig.caKey ||
                        !existingConfig.clientCert ||
                        !existingConfig.clientKey)
                ) {
                    try {
                        const { caCertPem, caKeyPem, clientCertPem, clientKeyPem } =
                            await generateMasterCerts();

                        await tx.keygen.update({
                            where: { uuid: existingConfig.uuid },
                            data: {
                                caCert: caCertPem,
                                caKey: caKeyPem,
                                clientCert: clientCertPem,
                                clientKey: clientKeyPem,
                            },
                        });

                        consola.success('Keygen updated');
                        return;
                    } catch (error) {
                        consola.error('Failed to update keygen:', error);
                        process.exit(1);
                    }
                }

                return;
            },
            {
                timeout: 30000,
                isolationLevel: 'Serializable',
            },
        );

        consola.success('Keygen seeded');
        return;
    } catch (error) {
        consola.error('Failed to seed keygen:', error);
        process.exit(1);
    }
}
