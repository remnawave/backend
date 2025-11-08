import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { ConfigProfileSchema } from '../../models';

export namespace GetComputedConfigProfileByUuidCommand {
    export const url = REST_API.CONFIG_PROFILES.GET_COMPUTED_CONFIG_BY_PROFILE_UUID;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.GET_COMPUTED_CONFIG_BY_PROFILE_UUID(':uuid'),
        'get',
        'Get computed config profile by uuid',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ConfigProfileSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
