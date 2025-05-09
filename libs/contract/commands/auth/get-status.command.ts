import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { AUTH_ROUTES, REST_API } from '../../api';

export namespace GetStatusCommand {
    export const url = REST_API.AUTH.GET_STATUS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.GET_STATUS,
        'get',
        'Get the status of the authentication',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            isLoginAllowed: z.boolean(),
            isRegisterAllowed: z.boolean(),
            tgAuth: z
                .object({
                    botId: z.number(),
                })
                .nullable(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
