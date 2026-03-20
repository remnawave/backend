import { PrismaClient } from '@prisma/client';
import consola from 'consola';

export async function verifyAdminUser(prisma: PrismaClient) {
    const adminsCount = await prisma.admin.count();
    if (adminsCount === 0 || adminsCount === 1) {
        // first start
        return;
    } else {
        consola.warn(
            'Seems like there was direct database modification. Retaining oldest admin and removing all others...',
        );

        const oldestAdmin = await prisma.admin.findFirst({
            orderBy: { createdAt: 'asc' },
        });

        if (oldestAdmin) {
            await prisma.admin.deleteMany({
                where: {
                    uuid: {
                        not: oldestAdmin.uuid,
                    },
                },
            });
            consola.success(
                `Retained oldest admin: ${oldestAdmin.username} and removed all others`,
            );
        }

        return;
    }
}
