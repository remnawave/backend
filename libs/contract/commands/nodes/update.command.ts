import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';
import { NodesSchema } from '../../models';

export namespace UpdateNodeCommand {
    export const url = REST_API.NODES.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(NODES_ROUTES.UPDATE, 'patch', 'Update node');

    export const RequestSchema = NodesSchema.pick({
        uuid: true,
    }).extend({
        name: z.optional(z.string().min(3, 'Min. 3 characters').max(30, 'Max. 30 characters')),
        address: z.optional(z.string().min(2, 'Min. 2 characters')),
        port: z.optional(
            z
                .number()
                .min(1, 'Port must be greater than 0')
                .max(65535, 'Port must be less than 65535'),
        ),
        isTrafficTrackingActive: z.optional(z.boolean()),
        trafficLimitBytes: z.optional(z.number().min(0, 'Traffic limit must be greater than 0')),
        notifyPercent: z.optional(
            z
                .number()
                .min(0, 'Notify percent must be greater than 0')
                .max(100, 'Notify percent must be less than 100'),
        ),
        trafficResetDay: z.optional(
            z
                .number()
                .min(1, 'Traffic reset day must be greater than 0')
                .max(31, 'Traffic reset day must be less than 31'),
        ),
        countryCode: z.optional(
            z.string().max(2, 'Country code must be 2 characters').toUpperCase(),
        ),
        consumptionMultiplier: z.optional(
            z
                .number()
                .min(0.1, 'Consumption multiplier must be greater than 0')
                .transform((n) => Number(n.toFixed(1))),
        ),
        configProfile: z
            .object({
                activeConfigProfileUuid: z.string().uuid(),
                activeInbounds: z.array(z.string().uuid(), {
                    invalid_type_error: 'Must be an array of UUIDs',
                }),
            })
            .optional(),

        providerUuid: z.optional(z.nullable(z.string().uuid())),
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
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: NodesSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
