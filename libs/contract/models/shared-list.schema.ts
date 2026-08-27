import z from 'zod';

export const SharedListNameSchema = z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .regex(
        /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/,
        'Name can only contain letters, numbers, underscores, dashes and slashes. The "ext:" prefix is added automatically',
    );

export const SharedListsSchema = z.object({
    name: SharedListNameSchema,
    config: z.record(z.string(), z.unknown()),
});

export const SharedListPreviewSchema = z.object({
    name: SharedListNameSchema,
    type: z.string(),
    itemsCount: z.number(),
});
