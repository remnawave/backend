import { z } from 'zod';

import { ConfigProfileInboundsSchema } from './config-profile-inbounds.schema';
import { PartialInfraProviderSchema } from './infra-provider.schema';
import { NodeIpsSchema } from './node-ips.schema';
import { NodeSystemSchema } from './node-system.schema';

export const NodesSchema = z.object({
    uuid: z.uuid(),
    id: z.number(),
    name: z.string(),
    address: z.string(),
    port: z.nullable(z.int()),
    proxyUrl: z.nullable(z.string()),
    isConnected: z.boolean(),
    isDisabled: z.boolean(),
    isConnecting: z.boolean(),
    lastStatusChange: z.nullable(z.iso.datetime().transform((str) => new Date(str))),
    lastStatusMessage: z.nullable(z.string()),
    isTrafficTrackingActive: z.boolean(),
    trafficResetDay: z.nullable(z.int()),
    trafficLimitBytes: z.nullable(z.number()),
    trafficUsedBytes: z.nullable(z.number()),
    notifyPercent: z.nullable(z.int()),
    viewPosition: z.int(),
    countryCode: z.string(),
    consumptionMultiplier: z.number(),
    nodeConsumptionMultiplier: z.number(),
    tags: z.array(z.string()),
    ips: NodeIpsSchema,

    createdAt: z.iso.datetime().transform((str) => new Date(str)),
    updatedAt: z.iso.datetime().transform((str) => new Date(str)),

    configProfile: z.object({
        activeConfigProfileUuid: z.nullable(z.uuid()),
        activeInbounds: z.array(ConfigProfileInboundsSchema),
    }),

    providerUuid: z.nullable(z.uuid()),
    provider: z.nullable(PartialInfraProviderSchema),
    activePluginUuid: z.nullable(z.uuid()),
    system: z.nullable(NodeSystemSchema),
    versions: z.nullable(
        z.object({
            xray: z.string(),
            node: z.string(),
        }),
    ),
    xrayUptime: z.number(),
    usersOnline: z.number(),
    note: z.nullable(z.string()),
});
