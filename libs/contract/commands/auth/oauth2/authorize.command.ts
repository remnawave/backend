import { z } from 'zod';

import { getEndpointDetails, OAUTH2_PROVIDERS } from '../../../constants';
import { AUTH_ROUTES, REST_API } from '../../../api';

export namespace OAuth2AuthorizeCommand {
    export const url = REST_API.AUTH.OAUTH2.AUTHORIZE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.OAUTH2.AUTHORIZE,
        'post',
        'Initiate OAuth2 authorization',
    );

    export const RequestSchema = z.object({
        provider: z.nativeEnum(OAUTH2_PROVIDERS),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            authorizationUrl: z.nullable(z.string().url()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
