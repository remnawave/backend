import { z } from 'zod';

import { NODE_INTEGRATIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace DeleteNodeIntegrationCommand {
    export const url = REST_API.NODE_INTEGRATIONS.DELETE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODE_INTEGRATIONS_ROUTES.DELETE(':uuid'),
        'delete',
        'Delete Node Integration',
        { scope: 'delete', kind: 'write' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid(),
    });

    export type RequestParam = z.infer<typeof RequestParamSchema>;
}
