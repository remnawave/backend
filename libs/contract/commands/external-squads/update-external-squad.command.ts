import { z } from 'zod';

import { getEndpointDetails, SUBSCRIPTION_TEMPLATE_TYPE } from '../../constants';
import { EXTERNAL_SQUADS_ROUTES, REST_API } from '../../api';
import { ExternalSquadSchema } from '../../models';

export namespace UpdateExternalSquadCommand {
    export const url = REST_API.EXTERNAL_SQUADS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        EXTERNAL_SQUADS_ROUTES.UPDATE,
        'patch',
        'Update external squad',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(30, 'Name must be less than 30 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            )
            .optional(),
        templates: z
            .array(
                z.object({
                    templateUuid: z.string().uuid(),
                    templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
                }),
            )
            .optional(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ExternalSquadSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
