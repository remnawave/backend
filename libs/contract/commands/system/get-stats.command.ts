import { z } from 'zod';
import { REST_API } from '../../api';
import { USERS_STATUS } from '../../constants';

export namespace GetStatsCommand {
    export const url = REST_API.SYSTEM.STATS;

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
                onlineLastMinute: z.number(),
                statusCounts: z.record(
                    z.enum(Object.values(USERS_STATUS) as [string, ...string[]]),
                    z.number(),
                ),
                totalUsers: z.number(),
                totalTrafficBytes: z.string(),
            }),
            stats: z.object({
                nodesUsageLastTwoDays: z.object({
                    current: z.string(),
                    previous: z.string(),
                    percentage: z.number(),
                }),
                sevenDaysStats: z.array(
                    z.object({
                        nodeName: z.string(),
                        totalBytes: z.string(),
                        date: z.string(),
                    }),
                ),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
