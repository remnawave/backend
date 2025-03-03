import { z } from 'zod';

import { BaseStatSchema } from '../../models/base-stat.schema';
import { REST_API } from '../../api';

export namespace GetBandwidthStatsCommand {
    export const url = REST_API.SYSTEM.BANDWIDTH;
    export const TSQ_url = url;

    export const RequestQuerySchema = z.object({
        tz: z.string().optional(),
    });

    export type Request = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            bandwidthLastTwoDays: BaseStatSchema,
            bandwidthLastSevenDays: BaseStatSchema,
            bandwidthLast30Days: BaseStatSchema,
            bandwidthCalendarMonth: BaseStatSchema,
            bandwidthCurrentYear: BaseStatSchema,
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
