import { z } from 'zod';

import { INBOUNDS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetInboundsCommand {
    export const url = REST_API.INBOUNDS.GET_INBOUNDS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        INBOUNDS_ROUTES.GET_INBOUNDS,
        'get',
        'Get inbounds',
    );

    export const ResponseSchema = z.object({
        response: z.array(
            z.object({
                uuid: z.string().uuid(),
                tag: z.string(),
                type: z.string(),
                port: z.number(),
                network: z.string().nullable(),
                security: z.string().nullable(),
            }),
        ),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
