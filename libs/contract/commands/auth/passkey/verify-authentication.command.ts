import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { AUTH_ROUTES, REST_API } from '../../../api';

export namespace VerifyPasskeyAuthenticationCommand {
    export const url = REST_API.AUTH.PASSKEY.VERIFY_AUTHENTICATION;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.PASSKEY.VERIFY_AUTHENTICATION,
        'post',
        'Verify the authentication for passkey',
    );

    export const RequestSchema = z.object({
        response: z.unknown(),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            accessToken: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
