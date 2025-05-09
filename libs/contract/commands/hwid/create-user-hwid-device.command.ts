import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { HwidUserDeviceSchema } from '../../models';
import { HWID_ROUTES, REST_API } from '../../api';

export namespace CreateUserHwidDeviceCommand {
    export const url = REST_API.HWID.CREATE_USER_HWID_DEVICE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.CREATE_USER_HWID_DEVICE,
        'post',
        'Create a user HWID device',
    );

    export const RequestSchema = z.object({
        hwid: z.string(),
        userUuid: z.string().uuid(),
        platform: z.optional(z.string()),
        osVersion: z.optional(z.string()),
        deviceModel: z.optional(z.string()),
        userAgent: z.optional(z.string()),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.array(HwidUserDeviceSchema),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
