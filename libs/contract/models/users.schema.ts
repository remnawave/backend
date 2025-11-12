import { z } from 'zod';

import { RESET_PERIODS, USERS_STATUS } from '../constants';

export const UsersSchema = z.object({
    uuid: z.string().uuid(),
    shortUuid: z.string(),
    username: z.string(),

    status: z.nativeEnum(USERS_STATUS).default(USERS_STATUS.ACTIVE),

    trafficLimitBytes: z.number().int().default(0),
    trafficLimitStrategy: z
        .nativeEnum(RESET_PERIODS, {
            description: 'Available reset periods',
        })
        .default(RESET_PERIODS.NO_RESET),

    expireAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),

    telegramId: z.nullable(z.number().int()),
    email: z.nullable(z.string().email()),
    description: z.nullable(z.string()),
    tag: z.nullable(z.string()),

    hwidDeviceLimit: z.nullable(z.number().int()),
    externalSquadUuid: z.nullable(z.string().uuid()),

    trojanPassword: z.string(),
    vlessUuid: z.string().uuid(),
    ssPassword: z.string(),

    lastTriggeredThreshold: z.number().int().default(0),
    subRevokedAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),
    subLastUserAgent: z.nullable(z.string()),
    subLastOpenedAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),
    lastTrafficResetAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
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
