import { z } from 'zod';

import { REST_API, SUBSCRIPTION_PAGE_CONFIGS_ROUTES } from '../../../api';
import { SubscriptionPageConfigSchema } from '../../../models';
import { getEndpointDetails } from '../../../constants';

export namespace ReorderSubscriptionPageConfigsCommand {
    export const url = REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.REORDER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_PAGE_CONFIGS_ROUTES.ACTIONS.REORDER,
        'post',
        'Reorder subscription page configs',
    );

    export const RequestSchema = z.object({
        items: z.array(
            SubscriptionPageConfigSchema.pick({
                viewPosition: true,
                uuid: true,
            }),
        ),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            configs: z.array(SubscriptionPageConfigSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
