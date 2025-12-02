import { z } from 'zod';

import { REST_API, SUBSCRIPTION_TEMPLATE_ROUTES } from '../../../api';
import { SubscriptionTemplateSchema } from '../../../models';
import { getEndpointDetails } from '../../../constants';

export namespace ReorderSubscriptionTemplateCommand {
    export const url = REST_API.SUBSCRIPTION_TEMPLATE.ACTIONS.REORDER;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_TEMPLATE_ROUTES.ACTIONS.REORDER,
        'post',
        'Reorder subscription templates',
    );

    export const RequestSchema = z.object({
        items: z.array(
            SubscriptionTemplateSchema.pick({
                viewPosition: true,
                uuid: true,
            }),
        ),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            templates: z.array(SubscriptionTemplateSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
