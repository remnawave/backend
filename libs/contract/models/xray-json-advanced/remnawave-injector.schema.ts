import z from 'zod';

const HostSelectorSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('uuids'),
        values: z.array(z.string().uuid()).min(1),
    }),
    z.object({
        type: z.literal('remarkRegex'),
        pattern: z.string().min(1),
    }),
    z.object({
        type: z.literal('tagRegex'),
        pattern: z.string().min(1),
    }),
    z.object({
        type: z.literal('sameTagAsRecipient'),
    }),
]);

const InjectHostsEntrySchema = z.object({
    selector: HostSelectorSchema,
    tagPrefix: z.string().min(1),
});

export const RemnawaveInjectorSchema = z.object({
    injectHosts: z.array(InjectHostsEntrySchema).optional(),
});

export type TRemnawaveInjector = z.infer<typeof RemnawaveInjectorSchema>;
export type TRemnawaveInjectorSelector = z.infer<typeof HostSelectorSchema>;
