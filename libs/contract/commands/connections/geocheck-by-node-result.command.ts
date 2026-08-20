import { z } from 'zod';

import { CONNECTIONS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GeocheckByNodeResultCommand {
    export const url = REST_API.CONNECTIONS.GEOCHECK_BY_NODE_RESULT;
    export const TSQ_url = url(':jobId');

    export const endpointDetails = getEndpointDetails(
        CONNECTIONS_ROUTES.GEOCHECK_BY_NODE_RESULT(':jobId'),
        'get',
        'Get Geocheck for Node by Job ID',
        { scope: 'geocheck-result', kind: 'read' },
    );

    export const RequestParamSchema = z.object({
        jobId: z.string(),
    });

    export const GeocheckImageSchema = z.object({
        format: z.literal('svg'),
        media_type: z.literal('image/svg+xml'),
        encoding: z.literal('base64'),
        data: z.string().describe('Base64-encoded image, ready for a data: URL'),
    });

    export const ResponseSchema = z.object({
        response: z.object({
            isCompleted: z.boolean(),
            isFailed: z.boolean(),
            result: z
                .object({
                    success: z.boolean(),
                    nodeUuid: z.uuid(),
                    image: GeocheckImageSchema.nullable(),
                    rawReport: z
                        .record(z.string(), z.unknown())
                        .nullable()
                        .describe('The full node report with the image object stripped out'),
                    message: z.string().nullable(),
                })
                .nullable(),
        }),
    });

    export type GeocheckImage = z.infer<typeof GeocheckImageSchema>;
    export type RequestParam = z.infer<typeof RequestParamSchema>;
    export type Response = z.infer<typeof ResponseSchema>;
}
