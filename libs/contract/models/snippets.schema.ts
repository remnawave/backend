import { z } from 'zod';

export const SnippetsSchema = z.object({
    name: z.string(),
    snippet: z.unknown(),
});
