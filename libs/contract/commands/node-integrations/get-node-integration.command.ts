import { z } from 'zod';

import { NODE_INTEGRATIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { NodeIntegrationSchema } from '../../models';

export namespace GetNodeIntegrationCommand {
    export const url = REST_API.NODE_INTEGRATIONS.GET;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODE_INTEGRATIONS_ROUTES.GET(':uuid'),
        'get',
        'Get Node Integration by uuid',
        { scope: 'get', kind: 'read' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export const ResponseSchema = z.object({
        response: NodeIntegrationSchema,
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
