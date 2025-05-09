import { z } from 'zod';

import { FullInboundsSchema } from '../../models/full-inbounds.schema';
import { INBOUNDS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetFullInboundsCommand {
    export const url = REST_API.INBOUNDS.GET_FULL_INBOUNDS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        INBOUNDS_ROUTES.GET_FULL_INBOUNDS,
        'get',
        'Get inbounds with full details',
    );

    export const ResponseSchema = z.object({
        response: z.array(FullInboundsSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
