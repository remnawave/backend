import { z } from 'zod';

import { NODE_PLUGINS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace PluginExecutorCommand {
    export const url = REST_API.NODE_PLUGINS.EXECUTOR;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.EXECUTOR,
        'post',
        'Execute command on node plugins',
    );

    export const CommandSchema = z.discriminatedUnion('command', [
        z
            .object({
                command: z.literal('blockIps'),
                ips: z
                    .array(
                        z.object({
                            ip: z.string().ip(),
                            timeout: z.number(),
                        }),
                    )
                    .min(1),
            })
            .describe('Block IPs'),
        z
            .object({
                command: z.literal('unblockIps'),
                ips: z.array(z.string().ip()).min(1),
            })
            .describe('Unblock IPs'),
        z
            .object({
                command: z.literal('recreateTables'),
            })
            .describe('Recreate tables'),
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
        command: CommandSchema,
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
