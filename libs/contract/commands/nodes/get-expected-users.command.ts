import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';

export namespace GetExpectedUsersCommand {
    export const url = REST_API.NODES.EXPECTED_USERS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.EXPECTED_USERS(':uuid'),
        'get',
        'Get the list of ACTIVE users whose squad inbounds overlap this node — used by compono-relay-sync to detect drift.',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            nodeUuid: z.string().uuid(),
            users: z.array(
                z.object({
                    tId: z.number().int(),
                    vlessUuid: z.string().uuid(),
                    username: z.string(),
                    inboundTags: z.array(z.string()),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
