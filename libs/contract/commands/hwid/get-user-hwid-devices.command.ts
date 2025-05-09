import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { HwidUserDeviceSchema } from '../../models';
import { HWID_ROUTES, REST_API } from '../../api';

export namespace GetUserHwidDevicesCommand {
    export const url = REST_API.HWID.GET_USER_HWID_DEVICES;
    export const TSQ_url = url(':userUuid');

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.GET_USER_HWID_DEVICES(':userUuid'),
        'get',
        'Get user HWID devices',
    );

    export const RequestSchema = z.object({
        userUuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(HwidUserDeviceSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
