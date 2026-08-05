import { z } from 'zod';

import { NODES_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodeIpsSchema, NodesSchema } from '../../models';
import { NodeResponseSchema } from './node.response';

export namespace UpdateNodeCommand {
    export const url = REST_API.NODES.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(NODES_ROUTES.UPDATE, 'patch', 'Update node', {
        scope: 'update',
        kind: 'write',
    });

    export const RequestBodySchema = NodesSchema.pick({
        uuid: true,
    }).extend({
        name: z.optional(z.string().min(3).max(30)),
        address: z.optional(z.string().min(2)),
        port: z.optional(z.number().min(1).max(65535)),
        proxyUrl: z
            .string()
            .regex(
                /^socks5:\/\/(?:[^:@/\s]+(?::[^@/\s]*)?@)?[^:@/\s]+:\d{1,5}$/,
                'Expected socks5://[user:pass@]host:port',
            )
            .nullish(),
        isTrafficTrackingActive: z.optional(z.boolean()),
        trafficLimitBytes: z.optional(z.number().min(0)),
        notifyPercent: z.optional(z.number().min(0).max(100)),
        trafficResetDay: z.optional(z.number().min(1).max(31)),
        countryCode: z.optional(z.string().max(2).toUpperCase()),
        consumptionMultiplier: z.optional(
            z
                .number()
                .min(0.0)
                .max(100.0)
                .transform((n) => Number(n.toFixed(1))),
        ),
        nodeConsumptionMultiplier: z.optional(
            z
                .number()
                .min(0.0)
                .max(100.0)
                .transform((n) => Number(n.toFixed(1))),
        ),
        configProfile: z
            .object({
                activeConfigProfileUuid: z.uuid(),
                activeInbounds: z.array(z.uuid()),
            })
            .optional(),

        providerUuid: z.uuid().nullish(),
        tags: z.optional(
            z
                .array(
                    z
                        .string()
                        .regex(
                            /^[A-Z0-9_:]+$/,
                            'Tag can only contain uppercase letters, numbers, underscores and colons',
                        )
                        .max(36, 'Each tag must be less than 36 characters'),
                )
                .max(10, 'Maximum 10 tags'),
        ),
        activePluginUuid: z.uuid().nullish(),
        note: z.optional(z.string().max(255).nullable()),
        ips: z.optional(NodeIpsSchema),
    });

    export const ResponseSchema = NodeResponseSchema;

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
