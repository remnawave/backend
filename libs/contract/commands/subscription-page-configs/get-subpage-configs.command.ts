import { z } from 'zod';

import { REST_API, SUBSCRIPTION_PAGE_CONFIGS_ROUTES } from '../../api';
import { SubscriptionPageConfigSchema } from '../../models';
import { getEndpointDetails } from '../../constants';

export namespace GetSubscriptionPageConfigsCommand {
    export const url = REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_PAGE_CONFIGS_ROUTES.GET_ALL,
        'get',
        'Get all subscription page configs',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            configs: z.array(SubscriptionPageConfigSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
