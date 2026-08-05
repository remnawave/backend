import { z } from 'zod';

import { NODES_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodeIpsSchema } from '../../models';
import { NodeResponseSchema } from './node.response';
export namespace CreateNodeCommand {
    export const url = REST_API.NODES.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.CREATE,
        'post',
        'Create a new node',
        { scope: 'create', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: z.string().min(3).max(30),
        address: z.string().min(2),
        port: z.int().min(1).max(65535).optional(),
        proxyUrl: z
            .string()
            .regex(
                /^socks5:\/\/(?:[^:@/\s]+(?::[^@/\s]*)?@)?[^:@/\s]+:\d{1,5}$/,
                'Expected socks5://[user:pass@]host:port',
            )
            .nullish(),
        isTrafficTrackingActive: z.boolean().optional().default(false),
        trafficLimitBytes: z.number().min(0).optional(),
        notifyPercent: z.int().min(0).max(100).optional(),
        trafficResetDay: z.int().min(1).max(31).optional(),
        countryCode: z.string().max(2).toUpperCase().default('XX'),
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

        configProfile: z.object({
            activeConfigProfileUuid: z.uuid(),
            activeInbounds: z.array(z.uuid()),
        }),

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
        activePluginUuid: z.optional(z.nullable(z.uuid())),
        note: z.optional(z.string().max(255, 'Note must be less than 255 characters')),
        ips: z.optional(NodeIpsSchema),
    });

    export const ResponseSchema = NodeResponseSchema;

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
