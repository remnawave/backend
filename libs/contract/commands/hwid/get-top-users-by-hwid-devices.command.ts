import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { HWID_ROUTES, REST_API } from '../../api';

export namespace GetTopUsersByHwidDevicesCommand {
    export const url = REST_API.HWID.TOP_USERS_BY_DEVICES;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.TOP_USERS_BY_DEVICES,
        'get',
        'Get top users by HWID devices',
    );

    export const RequestQuerySchema = z.object({
        start: z.coerce
            .number()
            .default(0)
            .describe('Start index (offset) of the results to return, default is 0'),
        size: z.coerce
            .number()
            .min(1, 'Size (limit) must be greater than 0')
            .max(100, 'Size (limit) must be less than 100')
            .describe('Number of results to return, no more than 100')
            .default(5),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            users: z.array(
                z.object({
                    userUuid: z.string().uuid(),
                    id: z.number(),
                    username: z.string(),
                    devicesCount: z.number(),
                }),
            ),
            total: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
