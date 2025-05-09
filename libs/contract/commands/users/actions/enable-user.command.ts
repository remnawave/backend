import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace EnableUserCommand {
    export const url = REST_API.USERS.ACTIONS.ENABLE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.ACTIONS.ENABLE(':uuid'),
        'post',
        'Enable user',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExtendedUsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
