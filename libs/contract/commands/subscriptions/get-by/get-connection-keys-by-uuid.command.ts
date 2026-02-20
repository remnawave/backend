import { z } from 'zod';

import { REST_API, SUBSCRIPTIONS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetConnectionKeysByUuidCommand {
    export const url = REST_API.SUBSCRIPTIONS.GET_CONNECTION_KEYS_BY_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTIONS_ROUTES.GET_CONNECTION_KEYS_BY_UUID(':uuid'),
        'get',
        'Get connection keys (base64 format) by uuid',
    );

    export const RequestSchema = z.object({
        uuid: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            enabledKeys: z.array(z.string()),
            hiddenKeys: z.array(z.string()),
            disabledKeys: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
