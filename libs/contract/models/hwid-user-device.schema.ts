import { z } from 'zod';

export const HwidUserDeviceSchema = z.object({
    hwid: z.string(),
    userId: z.number(),
    platform: z.nullable(z.string()),
    osVersion: z.nullable(z.string()),
    deviceModel: z.nullable(z.string()),
    userAgent: z.nullable(z.string()),
    requestIp: z.nullable(z.string()),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
