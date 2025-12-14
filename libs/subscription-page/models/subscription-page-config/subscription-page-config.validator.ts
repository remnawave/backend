import { z } from 'zod';

import { TSubscriptionPageConfigAdditionalLocales } from '../../constants';
import { LocalizedTextSchema } from './subscription-page-config.schema';

export const validateLocalizedTexts = (
    obj: unknown,
    requiredLocales: TSubscriptionPageConfigAdditionalLocales[],
    path: string,
    ctx: z.RefinementCtx,
): void => {
    if (obj === null || typeof obj !== 'object') return;

    if ('en' in obj && typeof (obj as z.infer<typeof LocalizedTextSchema>).en === 'string') {
        for (const locale of requiredLocales) {
            const value = (obj as z.infer<typeof LocalizedTextSchema>)[locale];
            if (!value || value.trim() === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Missing required locale '${locale}' at ${path}`,
                    path: [path, locale],
                });
            }
        }
        return;
    }

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                validateLocalizedTexts(item, requiredLocales, `${path}.${key}[${index}]`, ctx);
            });
        } else if (typeof value === 'object' && value !== null) {
            validateLocalizedTexts(value, requiredLocales, `${path}.${key}`, ctx);
        }
    }
};
