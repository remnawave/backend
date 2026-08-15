import z from 'zod';

export const NodeIntegrationSchema = z.object({
    uuid: z.uuid(),
    name: z.string(),
    description: z.nullable(z.string()),
    config: z.record(z.string(), z.unknown()),
});
