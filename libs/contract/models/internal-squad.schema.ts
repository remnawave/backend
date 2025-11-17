import { z } from 'zod';

import { ConfigProfileInboundsSchema } from './config-profile-inbounds.schema';

export const InternalSquadSchema = z.object({
    uuid: z.string().uuid(),
    viewPosition: z.number().int(),
    name: z.string(),

    info: z.object({
        membersCount: z.number(),
        inboundsCount: z.number(),
    }),

    inbounds: z.array(ConfigProfileInboundsSchema),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
