import { z } from 'zod';

import { REST_API, SUBSCRIPTION_TEMPLATE_ROUTES } from '../../api';
import { SUBSCRIPTION_TEMPLATE_TYPE } from '../../constants';
import { getEndpointDetails } from '../../constants';

export namespace UpdateSubscriptionTemplateCommand {
    export const url = REST_API.SUBSCRIPTION_TEMPLATE.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_TEMPLATE_ROUTES.UPDATE,
        'put',
        'Update subscription template',
    );

    export const RequestSchema = z.object({
        templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
        templateJson: z.optional(z.object({}).passthrough()),
        encodedTemplateYaml: z.optional(z.string()),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            uuid: z.string().uuid(),
            templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
            templateJson: z.nullable(z.unknown()),
            encodedTemplateYaml: z.nullable(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
