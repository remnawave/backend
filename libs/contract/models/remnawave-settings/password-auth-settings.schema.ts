import z from 'zod';

export const PasswordAuthSettingsSchema = z.object({
    enabled: z.boolean(),
});

export type TPasswordAuthSettings = z.infer<typeof PasswordAuthSettingsSchema>;
