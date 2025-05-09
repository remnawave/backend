import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { AUTH_ROUTES, REST_API } from '../../../api';

export namespace TelegramCallbackCommand {
    export const url = REST_API.AUTH.OAUTH2.TELEGRAM_CALLBACK;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.OAUTH2.TELEGRAM_CALLBACK,
        'post',
        'Callback from Telegram OAuth2',
    );

    export const RequestSchema = z.object({
        id: z.number(),
        first_name: z.string(),
        last_name: z.string().optional(),
        username: z.string().optional(),
        photo_url: z.string().optional(),
        auth_date: z.number(),
        hash: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            accessToken: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
