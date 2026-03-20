import { z } from 'zod';

import { REST_API, METADATA_ROUTES } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace UpsertNodeMetadataCommand {
    export const url = REST_API.METADATA.NODE.UPSERT;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        METADATA_ROUTES.NODE.UPSERT(':uuid'),
        'put',
        'Update or create Node Metadata',
    );

    export const RequestParamsSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type RequestParams = z.infer<typeof RequestParamsSchema>;

    export const RequestBodySchema = z.object({
        metadata: z.object({}).passthrough(),
    });

    export type RequestBody = z.infer<typeof RequestBodySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            metadata: z.object({}).passthrough(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
