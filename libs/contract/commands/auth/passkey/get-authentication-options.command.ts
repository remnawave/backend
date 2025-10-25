import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { AUTH_ROUTES, REST_API } from '../../../api';

export namespace GetPasskeyAuthenticationOptionsCommand {
    export const url = REST_API.AUTH.PASSKEY.GET_AUTHENTICATION_OPTIONS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.PASSKEY.GET_AUTHENTICATION_OPTIONS,
        'get',
        'Get the authentication options for passkey',
    );

    export const ResponseSchema = z.object({
        response: z.unknown(),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
