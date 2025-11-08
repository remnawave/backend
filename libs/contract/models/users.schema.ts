import { z } from 'zod';

import { BaseInternalSquadSchema } from './base-internal-squad.schema';
import { RESET_PERIODS, USERS_STATUS } from '../constants';

export const UsersSchema = z.object({
    uuid: z.string().uuid(),
    shortUuid: z.string(),
    username: z.string(),

    status: z.nativeEnum(USERS_STATUS).default(USERS_STATUS.ACTIVE),

    usedTrafficBytes: z.number(),
    lifetimeUsedTrafficBytes: z.number(),

    trafficLimitBytes: z.number().int().default(0),
    trafficLimitStrategy: z
        .nativeEnum(RESET_PERIODS, {
            description: 'Available reset periods',
        })
        .default(RESET_PERIODS.NO_RESET),
    subLastUserAgent: z.nullable(z.string()),
    subLastOpenedAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),

    expireAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),

    onlineAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),
    subRevokedAt: z.nullable(
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

    trojanPassword: z.string(),
    vlessUuid: z.string().uuid(),
    ssPassword: z.string(),

    description: z.nullable(z.string()),
    tag: z.nullable(z.string()),

    telegramId: z.nullable(z.number().int()),
    email: z.nullable(z.string().email()),

    hwidDeviceLimit: z.nullable(z.number().int()),

    firstConnectedAt: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),

    lastTriggeredThreshold: z.number().int().default(0),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),

    activeInternalSquads: z.array(BaseInternalSquadSchema),
    externalSquadUuid: z.nullable(z.string().uuid()),
});
