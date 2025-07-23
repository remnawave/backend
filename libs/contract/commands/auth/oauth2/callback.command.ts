import { z } from 'zod';

import { getEndpointDetails, OAUTH2_PROVIDERS } from '../../../constants';
import { AUTH_ROUTES, REST_API } from '../../../api';

export namespace OAuth2CallbackCommand {
    export const url = REST_API.AUTH.OAUTH2.CALLBACK;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.OAUTH2.CALLBACK,
        'post',
        'Callback from OAuth2',
    );

    export const RequestSchema = z.object({
        provider: z.nativeEnum(OAUTH2_PROVIDERS),
        code: z.string(),
        state: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            accessToken: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
