import { z } from 'zod';

import { NODE_INTEGRATIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodeIntegrationSchema } from '../../models';

export namespace CreateNodeIntegrationCommand {
    export const url = REST_API.NODE_INTEGRATIONS.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_INTEGRATIONS_ROUTES.CREATE,
        'post',
        'Create Node Integration',
        { scope: 'create', kind: 'write' },
    );

    export const RequestBodySchema = z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(30, 'Name must be less than 30 characters'),
        description: z.nullish(z.string().max(255, 'Description must be less than 255 characters')),
        config: z.record(z.string(), z.unknown()),
    });

    export const ResponseSchema = z.object({
        response: NodeIntegrationSchema,
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
