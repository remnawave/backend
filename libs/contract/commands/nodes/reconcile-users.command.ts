import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { NODES_ROUTES, REST_API } from '../../api';

export namespace ReconcileUsersCommand {
    export const url = REST_API.NODES.RECONCILE_USERS;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        NODES_ROUTES.RECONCILE_USERS(':uuid'),
        'post',
        'Reconcile xray on a node with the panel DB: add ACTIVE users that are missing per inbound tag, remove users that no longer belong. Idempotent — safe to call every relay-sync cycle. Replaces the unreliable AddUserToNodeEvent push for new users (BDT-27).',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            nodeUuid: z.string().uuid(),
            added: z.array(
                z.object({
                    username: z.string(),
                    tags: z.array(z.string()),
                }),
            ),
            removed: z.array(
                z.object({
                    username: z.string(),
                    tags: z.array(z.string()),
                }),
            ),
            errors: z.array(
                z.object({
                    username: z.string(),
                    tag: z.string(),
                    phase: z.enum(['add', 'remove']),
                    error: z.string(),
                }),
            ),
            unreachableTags: z.array(z.string()),
            skipped: z.boolean(),
            skipReason: z.string().nullable(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
