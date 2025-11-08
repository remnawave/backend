import { z } from 'zod';

import { PASSKEYS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetPasskeyRegistrationOptionsCommand {
    export const url = REST_API.PASSKEYS.GET_REGISTRATION_OPTIONS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        PASSKEYS_ROUTES.GET_REGISTRATION_OPTIONS,
        'get',
        'Get registration options for passkey',
    );

    export const ResponseSchema = z.object({
        response: z.unknown(),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
