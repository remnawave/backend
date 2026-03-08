import { z } from 'zod';

import { TorrentBlockerReportSchema, TanstackQueryRequestQuerySchema } from '../../../models';
import { REST_API, NODE_PLUGINS_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace GetTorrentBlockerReportsCommand {
    export const url = REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.TORRENT_BLOCKER.GET_REPORTS,
        'get',
        'Get Torrent Blocker Reports',
    );

    export const RequestQuerySchema = TanstackQueryRequestQuerySchema;

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            records: z.array(TorrentBlockerReportSchema),
            total: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
