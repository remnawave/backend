import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { ConfigProfileInboundsSchema } from '../../models';

export namespace GetAllInboundsCommand {
    export const url = REST_API.CONFIG_PROFILES.GET_ALL_INBOUNDS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.GET_ALL_INBOUNDS,
        'get',
        'Get all inbounds from all config profiles',
        { scope: 'list-inbounds', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            inbounds: z.array(
                ConfigProfileInboundsSchema.extend({
                    activeSquads: z.array(z.uuid()),
                    onlineByNode: z
                        .array(
                            z.object({
                                nodeUuid: z.uuid(),
                                count: z.number(),
                            }),
                        )
                        .describe(
                            'Live online users count for this inbound, broken down by node (~16s TTL)',
                        ),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
