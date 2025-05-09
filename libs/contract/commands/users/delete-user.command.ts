import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace DeleteUserCommand {
    export const url = REST_API.USERS.DELETE;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.DELETE(':uuid'),
        'delete',
        'Delete user',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isDeleted: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
