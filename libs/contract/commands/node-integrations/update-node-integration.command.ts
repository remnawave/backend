import { z } from 'zod';

import { NODE_INTEGRATIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodeIntegrationSchema } from '../../models';

export namespace UpdateNodeIntegrationCommand {
    export const url = REST_API.NODE_INTEGRATIONS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_INTEGRATIONS_ROUTES.UPDATE,
        'patch',
        'Update Node Integration',
        { scope: 'update', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        uuid: z.uuid(),
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(30, 'Name must be less than 30 characters')
            .optional(),
        description: z.nullish(z.string().max(255, 'Description must be less than 255 characters')),
        config: z.record(z.string(), z.unknown()).optional(),
        restartNodes: z.optional(z.boolean()),
    });

    export const ResponseSchema = z.object({
        response: NodeIntegrationSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
