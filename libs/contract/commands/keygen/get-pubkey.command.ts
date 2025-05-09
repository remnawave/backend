import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { KEYGEN_ROUTES, REST_API } from '../../api';
export namespace GetPubKeyCommand {
    export const url = REST_API.KEYGEN.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        KEYGEN_ROUTES.GET,
        'get',
        'Get SSL_CERT for Remnawave Node',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            pubKey: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
