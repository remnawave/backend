import { z } from 'zod';

export const TagSchema = z
    .string()
    .regex(
        /^[A-Z0-9_:]+$/,
        'Tag can only contain uppercase letters, numbers, underscores and colons',
    )
    .max(36, 'Each tag must be less than 36 characters');

export const TagsSchema = z.array(TagSchema).max(10, 'Maximum 10 tags');
