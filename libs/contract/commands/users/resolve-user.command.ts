import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, USERS_ROUTES } from '../../api';

export namespace ResolveUserCommand {
    export const url = REST_API.USERS.RESOLVE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USERS_ROUTES.RESOLVE,
        'post',
        'Resolve a user',
    );

    export const RequestSchema = z
        .object({
            uuid: z.string().uuid().optional(),
            id: z.number().optional(),
            shortUuid: z.string().optional(),
            username: z.string().optional(),
        })
        .refine(
            (data) => {
                const provided = [data.uuid, data.id, data.shortUuid, data.username].filter(
                    (v) => v !== undefined,
                );
                return provided.length === 1;
            },
            {
                message: 'Exactly one of uuid, id, shortUuid, or username must be provided',
            },
        );

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            uuid: z.string().uuid(),
            username: z.string(),
            id: z.number(),
            shortUuid: z.string(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
