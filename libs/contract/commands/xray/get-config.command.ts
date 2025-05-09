import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, XRAY_ROUTES } from '../../api';

export namespace GetXrayConfigCommand {
    export const url = REST_API.XRAY.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(XRAY_ROUTES.GET, 'get', 'Get XRay config');

    export const ResponseSchema = z.object({
        response: z.object({
            config: z.unknown(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
