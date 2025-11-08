import { z } from 'zod';

import { EXTERNAL_SQUADS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { ExternalSquadSchema } from '../../models';

export namespace GetExternalSquadsCommand {
    export const url = REST_API.EXTERNAL_SQUADS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        EXTERNAL_SQUADS_ROUTES.GET,
        'get',
        'Get all external squads',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            externalSquads: z.array(ExternalSquadSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
