import { z } from 'zod';

import { TSubscriptionPageLanguageCode, isLanguageCode } from '../constants';

const isLocalizedText = (obj: unknown): obj is Record<string, string> => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return false;

    const entries = Object.entries(obj);
    if (entries.length === 0) return false;

    const hasStringValues = entries.every(([, value]) => typeof value === 'string');
    const hasLanguageCodeKey = entries.some(([key]) => key.length === 2);

    return hasStringValues && hasLanguageCodeKey;
};

export const validateLocalizedTexts = (
    data: {
        locales: TSubscriptionPageLanguageCode[];
        platforms: Record<string, unknown>;
        uiConfig: unknown;
        baseTranslations: unknown;
    },
    requiredLocales: TSubscriptionPageLanguageCode[],
    ctx: z.RefinementCtx,
): void => {
    const checkLocalizedText = (obj: unknown, path: string): void => {
        if (obj === null || typeof obj !== 'object') return;

        if (isLocalizedText(obj)) {
            for (const locale of requiredLocales) {
                const value = obj[locale];
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

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                checkLocalizedText(item, `${path}[${index}]`);
            });
            return;
        }

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                checkLocalizedText(value, `${path}.${key}`);
            }
        }
    };

    checkLocalizedText(data.platforms, 'platforms');
    checkLocalizedText(data.baseTranslations, 'baseTranslations');
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
    activeLocales: TSubscriptionPageLanguageCode[],
): T => {
    if (obj === null || typeof obj !== 'object') return obj;

    if (isLocalizedText(obj)) {
        const allowedKeys = new Set<string>(activeLocales);
        const cleaned: Record<string, string> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && isLanguageCode(key) && allowedKeys.has(key)) {
                const trimmed = value.trim();
                if (trimmed) {
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
