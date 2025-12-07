import { z } from 'zod';

import { ConfigProfileInboundsSchema } from './config-profile-inbounds.schema';

export const ConfigProfileSchema = z.object({
    uuid: z.string().uuid(),
    viewPosition: z.number().int(),
    name: z.string(),
    config: z.unknown(),
    inbounds: z.array(ConfigProfileInboundsSchema),
    nodes: z.array(
        z.object({
            uuid: z.string().uuid(),
            name: z.string(),
            countryCode: z.string(),
        }),
    ),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
