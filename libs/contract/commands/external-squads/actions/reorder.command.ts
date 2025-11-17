import { z } from 'zod';

import { EXTERNAL_SQUADS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { ExternalSquadSchema } from '../../../models';

export namespace ReorderExternalSquadCommand {
    export const url = REST_API.EXTERNAL_SQUADS.ACTIONS.REORDER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        EXTERNAL_SQUADS_ROUTES.ACTIONS.REORDER,
        'post',
        'Reorder external squads',
    );

    export const RequestSchema = z.object({
        items: z.array(
            ExternalSquadSchema.pick({
                viewPosition: true,
                uuid: true,
            }),
        ),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            externalSquads: z.array(ExternalSquadSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
