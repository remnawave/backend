import z from 'zod';

import { SUBSCRIPTION_TEMPLATE_TYPE } from '../constants';

export const SubscriptionTemplateSchema = z.object({
    uuid: z.string().uuid(),
    viewPosition: z.number().int(),
    name: z.string(),
    templateType: z.nativeEnum(SUBSCRIPTION_TEMPLATE_TYPE),
    templateJson: z.nullable(z.unknown()),
    encodedTemplateYaml: z.nullable(z.string()),
});
