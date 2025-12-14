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

export const validateSvgReferences = (
    data: { svgLibrary: Record<string, string>; platforms: Record<string, unknown> },
    ctx: z.RefinementCtx,
): void => {
    const validKeys = new Set(Object.keys(data.svgLibrary));

    const checkSvgRef = (obj: unknown, path: string): void => {
        if (obj === null || typeof obj !== 'object') return;

        for (const [key, value] of Object.entries(obj)) {
            if (key === 'svgIconKey' && typeof value === 'string') {
                if (!validKeys.has(value)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Unknown svgIconKey '${value}' at ${path}.${key}. Available: ${[...validKeys].join(', ')}`,
                        path: [path, key],
                    });
                }
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => checkSvgRef(item, `${path}.${key}[${index}]`));
            } else if (typeof value === 'object' && value !== null) {
                checkSvgRef(value, `${path}.${key}`);
            }
        }
    };

    checkSvgRef(data.platforms, 'platforms');
};

export const cleanLocalizedTexts = <T>(
    obj: T,
    activeLocales: TSubscriptionPageConfigAdditionalLocales[],
): T => {
    if (obj === null || typeof obj !== 'object') return obj;

    if ('en' in obj && typeof (obj as Record<string, unknown>).en === 'string') {
        const allowedKeys = new Set(['en', ...activeLocales]);
        const cleaned: Record<string, string> = {};

        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (typeof value === 'string' && allowedKeys.has(key)) {
                const trimmed = value.trim();
                if (trimmed || key === 'en') {
                    cleaned[key] = trimmed;
                }
            }
        }
        return cleaned as T;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => cleanLocalizedTexts(item, activeLocales)) as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = cleanLocalizedTexts(value, activeLocales);
    }
    return result as T;
};
