import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, SYSTEM_ROUTES } from '../../api';
import { USERS_STATUS } from '../../constants';

export namespace GetStatsCommand {
    export const url = REST_API.SYSTEM.STATS.SYSTEM_STATS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SYSTEM_ROUTES.STATS.SYSTEM_STATS,
        'get',
        'Get Stats',
    );

    export const RequestQuerySchema = z.object({
        tz: z.string().optional(),
    });

    export type Request = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            cpu: z.object({
                cores: z.number(),
                physicalCores: z.number(),
            }),
            memory: z.object({
                total: z.number(),
                free: z.number(),
                used: z.number(),
                active: z.number(),
                available: z.number(),
            }),
            uptime: z.number(),
            timestamp: z.number(),
            users: z.object({
                statusCounts: z.record(
                    z.enum(Object.values(USERS_STATUS) as [string, ...string[]]),
                    z.number(),
                ),
                totalUsers: z.number(),
                totalTrafficBytes: z.string(),
            }),
            onlineStats: z.object({
                lastDay: z.number(),
                lastWeek: z.number(),
                neverOnline: z.number(),
                onlineNow: z.number(),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
