import { z } from 'zod';

import { REMNAAWAVE_SETTINGS_ROUTES, REST_API } from '../../api';
import { RemnawaveSettingsSchema } from '../../models';
import { getEndpointDetails } from '../../constants';

export namespace GetRemnawaveSettingsCommand {
    export const url = REST_API.REMNAAWAVE_SETTINGS.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        REMNAAWAVE_SETTINGS_ROUTES.GET,
        'get',
        'Get Remnawave settings',
    );

    export const ResponseSchema = z.object({
        response: RemnawaveSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
