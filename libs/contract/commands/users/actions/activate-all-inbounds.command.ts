import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace ActivateAllInboundsCommand {
    export const url = REST_API.USERS.ACTIONS.ACTIVATE_ALL_INBOUNDS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.ACTIONS.ACTIVATE_ALL_INBOUNDS(':uuid'),
        'post',
        'Activate all inbounds',
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
