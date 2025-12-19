import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';
import { NodesSchema } from '../../models';
export namespace CreateNodeCommand {
    export const url = REST_API.NODES.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.CREATE,
        'post',
        'Create a new node',
    );

    export const RequestSchema = z.object({
        name: z.string().min(3, 'Minimum 3 characters!').max(30, 'Maximum 30 characters!'),
        address: z.string().min(2, 'Minimum 2 characters!'),
        port: z
            .number()
            .int()
            .min(1, 'Port is required')
            .max(65535, 'Port must be less than 65535')
            .optional(),
        isTrafficTrackingActive: z.boolean().optional().default(false),
        trafficLimitBytes: z.optional(
            z.number().int().min(0, 'Traffic limit must be greater than 0'),
        ),
        notifyPercent: z.optional(
            z
                .number()
                .int()
                .min(0, 'Notify percent must be greater than 0')
                .max(100, 'Notify percent must be less than 100'),
        ),
        trafficResetDay: z.optional(
            z
                .number()
                .int()
                .min(1, 'Traffic reset day must be greater than 0')
                .max(31, 'Traffic reset day must be less than 31'),
        ),
        countryCode: z
            .string()
            .max(2, 'Country code must be 2 characters')
            .toUpperCase()
            .default('XX'),
        consumptionMultiplier: z.optional(
            z
                .number()
                .min(0.0, 'Consumption multiplier must be greater than 0.0')
                .max(100.0, 'Consumption multiplier must be less than 100.0')
                .transform((n) => Number(n.toFixed(1))),
        ),

        configProfile: z.object({
            activeConfigProfileUuid: z.string().uuid(),
            activeInbounds: z.array(z.string().uuid(), {
                invalid_type_error: 'Config profile inbound UUID must be an array of UUIDs',
            }),
        }),

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
