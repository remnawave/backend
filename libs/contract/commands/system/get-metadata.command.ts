import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { REST_API, SYSTEM_ROUTES } from '../../api';

export namespace GetMetadataCommand {
    export const url = REST_API.SYSTEM.METADATA;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SYSTEM_ROUTES.METADATA,
        'get',
        'Get Remnawave Information',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            version: z.string(),
            build: z.object({
                time: z.string(),
                number: z.string(),
            }),
            git: z.object({
                backend: z.object({
                    commitSha: z.string(),
                    branch: z.string(),
                    commitUrl: z.string(),
                }),
                frontend: z.object({
                    commitSha: z.string(),
                    commitUrl: z.string(),
                }),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
