import { z } from 'zod';

import { REST_API, SUBSCRIPTION_TEMPLATE_ROUTES } from '../../api';
import { SUBSCRIPTION_TEMPLATE_TYPE } from '../../constants';
import { getEndpointDetails } from '../../constants';

export namespace GetSubscriptionTemplatesCommand {
    export const url = REST_API.SUBSCRIPTION_TEMPLATE.GET_ALL;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_TEMPLATE_ROUTES.GET_ALL,
        'get',
        'Get all subscription templates (wihout content)',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            templates: z.array(
                z.object({
                    uuid: z.string().uuid(),
                    name: z.string(),
                    templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
                    templateJson: z.nullable(z.unknown()),
                    encodedTemplateYaml: z.nullable(z.string()),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
