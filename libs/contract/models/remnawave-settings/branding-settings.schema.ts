import z from 'zod';

export const BrandingSettingsSchema = z.object({
    title: z.nullable(z.string()),
    logoUrl: z.nullable(z.string().url()),
});

export type TBrandingSettings = z.infer<typeof BrandingSettingsSchema>;
