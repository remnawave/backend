import { z } from 'zod';

export const UserTrafficSchema = z.object({
    usedTrafficBytes: z.number(),
    lifetimeUsedTrafficBytes: z.number(),
    onlineAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),
    firstConnectedAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),
    lastConnectedNodeUuid: z.nullable(z.string().uuid()),
});
