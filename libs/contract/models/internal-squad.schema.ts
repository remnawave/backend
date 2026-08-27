import { z } from 'zod';

import { ConfigProfileInboundsSchema } from './config-profile-inbounds.schema';

export const InternalSquadSchema = z.object({
    uuid: z.uuid(),
    viewPosition: z.int(),
    name: z.string(),
    tags: z.array(z.string()),

    info: z.object({
        membersCount: z.number(),
        inboundsCount: z.number(),
    }),

    inbounds: z.array(ConfigProfileInboundsSchema),

    createdAt: z.iso.datetime().transform((str) => new Date(str)),
    updatedAt: z.iso.datetime().transform((str) => new Date(str)),
});
