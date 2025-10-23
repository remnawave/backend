import z from 'zod';

export const TgAuthSettingsSchema = z.object({
    enabled: z.boolean(),
    botToken: z.nullable(z.string()),
    adminIds: z.array(z.string()),
});

export type TTgAuthSettings = z.infer<typeof TgAuthSettingsSchema>;
