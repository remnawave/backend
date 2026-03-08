import { z } from 'zod';

import { REST_API, NODE_PLUGINS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetTorrentBlockerReportsStatsCommand {
    export const url = REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS_STATS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.TORRENT_BLOCKER.GET_REPORTS_STATS,
        'get',
        'Get Torrent Blocker Reports Stats',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            stats: z.object({
                distinctNodes: z.number(),
                distinctUsers: z.number(),
                totalReports: z.number(),
                reportsLast24Hours: z.number(),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
