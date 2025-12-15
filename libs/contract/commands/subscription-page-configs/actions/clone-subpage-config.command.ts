import { z } from 'zod';

import { REST_API, SUBSCRIPTION_PAGE_CONFIGS_ROUTES } from '../../../api';
import { SubscriptionPageConfigSchema } from '../../../models';
import { getEndpointDetails } from '../../../constants';

export namespace CloneSubscriptionPageConfigCommand {
    export const url = REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.CLONE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_PAGE_CONFIGS_ROUTES.ACTIONS.CLONE,
        'post',
        'Clone subscription page config',
    );

    export const RequestSchema = z.object({
        cloneFromUuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: SubscriptionPageConfigSchema.extend({
            config: z.unknown(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
