import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { NODES_ROUTES, REST_API } from '../../../api';

export namespace BulkNodesUpdateCommand {
    export const url = REST_API.NODES.BULK_ACTIONS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.BULK_ACTIONS.UPDATE,
        'post',
        'Update many nodes',
    );

    export const RequestSchema = z.object({
        uuids: z.array(z.string().uuid()).min(1, 'Must be at least 1 Node UUID'),
        fields: z.object({
            countryCode: z.optional(
                z.string().max(2, 'Country code must be 2 characters').toUpperCase(),
            ),
            consumptionMultiplier: z.optional(
                z
                    .number()
                    .min(0.0, 'Consumption multiplier must be greater than 0.0')
                    .max(100.0, 'Consumption multiplier must be less than 100.0')
                    .transform((n) => Number(n.toFixed(1))),
            ),
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
            activePluginUuid: z.optional(z.nullable(z.string().uuid())),
        }),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
