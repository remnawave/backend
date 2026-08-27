import z from 'zod';

import { SUBSCRIPTION_TEMPLATE_TYPE } from '../constants';

export const SubscriptionTemplateSchema = z.object({
    uuid: z.uuid(),
    viewPosition: z.number().int(),
    name: z.string(),
    tags: z.array(z.string()),
    templateType: z.enum(SUBSCRIPTION_TEMPLATE_TYPE),
    templateJson: z.nullable(z.unknown()),
    encodedTemplateYaml: z.nullable(z.string()),
});
