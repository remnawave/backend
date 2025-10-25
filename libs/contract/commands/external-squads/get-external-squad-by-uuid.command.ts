import { z } from 'zod';

import { EXTERNAL_SQUADS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { ExternalSquadSchema } from '../../models';

export namespace GetExternalSquadByUuidCommand {
    export const url = REST_API.EXTERNAL_SQUADS.GET_BY_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        EXTERNAL_SQUADS_ROUTES.GET_BY_UUID(':uuid'),
        'get',
        'Get external squad by uuid',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExternalSquadSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
