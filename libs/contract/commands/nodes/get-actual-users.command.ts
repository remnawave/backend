import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';

export namespace GetActualUsersCommand {
    export const url = REST_API.NODES.ACTUAL_USERS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.ACTUAL_USERS(':uuid'),
        'get',
        'Proxy: call get-inbound-users on the node for each of its active inbound tags and return the union. Used by compono-relay-sync to diff against expected-users.',
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
                    username: z.string(),
                    inboundTags: z.array(z.string()),
                }),
            ),
            unreachableTags: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
