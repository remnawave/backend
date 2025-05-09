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
        name: z.string().min(5, 'Minimum 5 characters!'),
        address: z.string().min(2, 'Minimum 2 characters!'),
        port: z.number().int().min(1, 'Port is required').optional(),
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
        excludedInbounds: z.optional(
            z.array(z.string().uuid(), {
                invalid_type_error: 'Excluded inbounds must be an array of UUIDs',
            }),
        ),
        countryCode: z
            .string()
            .max(2, 'Country code must be 2 characters')
            .toUpperCase()
            .default('XX'),
        consumptionMultiplier: z.optional(
            z
                .number()
                .min(0.1, 'Consumption multiplier must be greater than 0')
                .transform((n) => Number(n.toFixed(1))),
        ),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: NodesSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
