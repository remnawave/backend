import { z } from 'zod';

import { REST_API, SUBSCRIPTION_TEMPLATE_ROUTES } from '../../api';
import { SUBSCRIPTION_TEMPLATE_TYPE } from '../../constants';
import { getEndpointDetails } from '../../constants';

export namespace CreateSubscriptionTemplateCommand {
    export const url = REST_API.SUBSCRIPTION_TEMPLATE.CREATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_TEMPLATE_ROUTES.CREATE,
        'post',
        'Create subscription template',
    );

    export const RequestSchema = z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(255, 'Name must be less than 255 characters')
            .regex(
                /^[A-Za-z0-9_\s-]+$/,
                'Name can only contain letters, numbers, underscores, dashes and spaces',
            ),
        templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            uuid: z.string().uuid(),
            name: z.string(),
            templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
            templateJson: z.nullable(z.unknown()),
            encodedTemplateYaml: z.nullable(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
