import { z } from 'zod';

import { REST_API, SUBSCRIPTION_TEMPLATE_ROUTES } from '../../api';
import { SubscriptionTemplateSchema } from '../../models';
import { getEndpointDetails } from '../../constants';

export namespace GetSubscriptionTemplateCommand {
    export const url = REST_API.SUBSCRIPTION_TEMPLATE.GET;
    export const TSQ_url = url(':uuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_TEMPLATE_ROUTES.GET(':uuid'),
        'get',
        'Get subscription template by uuid',
    );

    export const RequestSchema = z.object({
        uuid: z.string().uuid(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: SubscriptionTemplateSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
