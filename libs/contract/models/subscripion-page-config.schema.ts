import z from 'zod';

export const SubscriptionPageConfigSchema = z.object({
    uuid: z.uuid(),
    viewPosition: z.number().int(),
    name: z.string(),
    tags: z.array(z.string()),
    config: z.nullable(z.unknown()),
});
