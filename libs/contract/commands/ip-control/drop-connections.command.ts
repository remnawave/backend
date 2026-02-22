import { z } from 'zod';

import { IP_CONTROL_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace DropConnectionsCommand {
    export const url = REST_API.IP_CONTROL.DROP_CONNECTIONS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        IP_CONTROL_ROUTES.DROP_CONNECTIONS,
        'post',
        'Drop Connections for Users or IPs',
    );

    export const DropBySchema = z.discriminatedUnion('by', [
        z
            .object({
                by: z.literal('userUuids'),
                userUuids: z.array(z.string().uuid()).min(1),
            })
            .describe('Drop by user UUIDs'),
        z
            .object({
                by: z.literal('ipAddresses'),
                ipAddresses: z.array(z.string().ip()).min(1),
            })
            .describe('Drop by IP addresses'),
    ]);

    export const TargetNodesSchema = z.discriminatedUnion('target', [
        z
            .object({
                target: z.literal('allNodes'),
            })
            .describe('Target all connected nodes'),
        z
            .object({
                target: z.literal('specificNodes'),
                nodeUuids: z.array(z.string().uuid()).min(1),
            })
            .describe('Target specific nodes'),
    ]);

    export const RequestSchema = z.object({
        dropBy: DropBySchema,
        targetNodes: TargetNodesSchema,
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            eventSent: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
