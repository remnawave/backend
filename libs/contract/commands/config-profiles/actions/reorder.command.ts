import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';
import { ConfigProfileSchema } from '../../../models';

export namespace ReorderConfigProfileCommand {
    export const url = REST_API.CONFIG_PROFILES.ACTIONS.REORDER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.ACTIONS.REORDER,
        'post',
        'Reorder config profiles',
    );

    export const RequestSchema = z.object({
        items: z.array(
            ConfigProfileSchema.pick({
                viewPosition: true,
                uuid: true,
            }),
        ),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            configProfiles: z.array(ConfigProfileSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
