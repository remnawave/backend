import { z } from 'zod';

import { getEndpointDetails } from '../../../constants';
import { ExtendedUsersSchema } from '../../../models';
import { REST_API, USERS_ROUTES } from '../../../api';

export namespace GetUserBySubscriptionUuidCommand {
    export const url = REST_API.USERS.GET_BY.SUBSCRIPTION_UUID;
    export const TSQ_url = url(':subscriptionUuid');

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.GET_BY.SUBSCRIPTION_UUID(':subscriptionUuid'),
        'get',
        'Get user by subscription UUID',
    );

    export const RequestSchema = z.object({
        subscriptionUuid: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExtendedUsersSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
