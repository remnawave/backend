import { z } from 'zod';

import { EXTERNAL_SQUADS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace DeleteUsersFromExternalSquadCommand {
    export const url = REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        EXTERNAL_SQUADS_ROUTES.BULK_ACTIONS.REMOVE_USERS(':uuid'),
        'delete',
        'Delete users from external squad',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
