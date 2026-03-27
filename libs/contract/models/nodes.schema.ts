import { z } from 'zod';

import { ConfigProfileInboundsSchema } from './config-profile-inbounds.schema';
import { PartialInfraProviderSchema } from './infra-provider.schema';
import { NodeSystemSchema } from './node-system.schema';

export const NodesSchema = z.object({
    uuid: z.string().uuid(),
    name: z.string(),
    address: z.string(),
    port: z.nullable(z.number().int()),
    isConnected: z.boolean(),
    isDisabled: z.boolean(),
    isConnecting: z.boolean(),
    lastStatusChange: z.nullable(
        z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
    ),
    lastStatusMessage: z.nullable(z.string()),
    isTrafficTrackingActive: z.boolean(),
    trafficResetDay: z.nullable(z.number().int()),
    trafficLimitBytes: z.nullable(z.number()),
    trafficUsedBytes: z.nullable(z.number()),
    notifyPercent: z.nullable(z.number().int()),
    viewPosition: z.number().int(),
    countryCode: z.string(),
    consumptionMultiplier: z.number(),
    tags: z.array(z.string()),

    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
    updatedAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),

    configProfile: z.object({
        activeConfigProfileUuid: z.nullable(z.string().uuid()),
        activeInbounds: z.array(ConfigProfileInboundsSchema),
    }),

    providerUuid: z.nullable(z.string().uuid()),
    provider: z.nullable(PartialInfraProviderSchema),
    activePluginUuid: z.nullable(z.string().uuid()),
    system: z.nullable(NodeSystemSchema),
    versions: z.nullable(
        z.object({
            xray: z.string(),
            node: z.string(),
        }),
    ),
    xrayUptime: z.number(),
    usersOnline: z.number(),
});
