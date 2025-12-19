import { z } from 'zod';

import { REST_API, SUBSCRIPTION_PAGE_CONFIGS_ROUTES } from '../../api';
import { SubscriptionPageConfigSchema } from '../../models';
import { getEndpointDetails } from '../../constants';

export namespace GetSubscriptionPageConfigCommand {
    export const url = REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_PAGE_CONFIGS_ROUTES.GET(':uuid'),
        'get',
        'Get subscription page config by uuid',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: SubscriptionPageConfigSchema.extend({
            config: z.unknown(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
