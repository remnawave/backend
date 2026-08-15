import { z } from 'zod';

import { NODES_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace BulkNodesUpdateCommand {
    export const url = REST_API.NODES.BULK_ACTIONS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.BULK_ACTIONS.UPDATE,
        'post',
        'Update many nodes',
        { scope: 'bulk-update', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        uuids: z.array(z.uuid()).min(1),
        fields: z.object({
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
            integrationUuids: z.optional(z.array(z.uuid()).max(20, 'Maximum 20 integrations')),
            note: z.optional(z.string().max(255).nullable()),
        }),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
}
