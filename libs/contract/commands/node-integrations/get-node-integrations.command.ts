import { z } from 'zod';

import { NODE_INTEGRATIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodeIntegrationSchema } from '../../models';

export namespace GetNodeIntegrationsCommand {
    export const url = REST_API.NODE_INTEGRATIONS.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_INTEGRATIONS_ROUTES.GET_ALL,
        'get',
        'Get all Node Integrations',
        { scope: 'list', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            nodeIntegrations: z.array(NodeIntegrationSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
