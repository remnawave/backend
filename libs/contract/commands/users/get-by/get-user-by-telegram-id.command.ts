import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace GetUserByTelegramIdCommand {
    export const url = REST_API.USERS.GET_BY.TELEGRAM_ID;
    export const TSQ_url = url(':telegramId');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.GET_BY.TELEGRAM_ID(':telegramId'),
        'get',
        'Get users by telegram ID',
    );

    export const RequestSchema = z.object({
        telegramId: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(ExtendedUsersSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
