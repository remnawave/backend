import z from 'zod';

export const SubscriptionPageConfigSchema = z.object({
    uuid: z.string().uuid(),
    viewPosition: z.number().int(),
    name: z.string(),
    config: z.nullable(z.unknown()),
});
