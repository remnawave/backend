import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { ConfigProfileInboundsSchema } from '../../models';

export namespace GetInboundsByProfileUuidCommand {
    export const url = REST_API.CONFIG_PROFILES.GET_INBOUNDS_BY_PROFILE_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.GET_INBOUNDS_BY_PROFILE_UUID(':uuid'),
        'get',
        'Get inbounds by profile uuid',
        { scope: 'list-profile-inbounds', kind: 'read' },
    );

    export const RequestParamSchema = z.object({
        uuid: z.uuid().describe('UUID of the config profile'),
    });

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

    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
