import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, XRAY_ROUTES } from '../../api';

export namespace UpdateXrayConfigCommand {
    export const url = REST_API.XRAY.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        XRAY_ROUTES.UPDATE,
        'put',
        'Update XRay config',
    );

    export const RequestSchema = z.object({}).passthrough();

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            config: z.unknown(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
