import { z } from 'zod';

import { REQUEST_TEMPLATE_TYPE } from '../../constants';
import { REST_API } from '../../api';

export namespace GetSubscriptionByShortUuidByClientTypeCommand {
    export const url = REST_API.SUBSCRIPTION.GET;
    export const TSQ_url = url(':shortUuid');

    export const RequestSchema = z.object({
        shortUuid: z.string(),
        clientType: z.nativeEnum(REQUEST_TEMPLATE_TYPE, {
            message: 'Invalid client type.',
        }),
    });

    export type Request = z.infer<typeof RequestSchema>;
}
