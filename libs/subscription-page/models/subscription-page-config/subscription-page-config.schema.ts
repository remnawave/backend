import { z } from 'zod';

import {
    SUBSCRIPTION_PAGE_CONFIG_VERSION,
    SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES,
    SUBSCRIPTION_PAGE_CONFIG_ADDITIONAL_LOCALES,
} from '../../constants';
import {
    validateLocalizedTexts,
    validateSvgReferences,
} from './subscription-page-config.validator';

export const LocalizedTextSchema = z.object({
    en: z.string(),
    ru: z.string().optional(),
    zh: z.string().optional(),
    fa: z.string().optional(),
    fr: z.string().optional(),
});

const SvgLibrarySchema = z.record(
    z.string().regex(/^[A-Za-z]+$/, { message: 'Only latin characters, no spaces allowed' }),
    z.string(),
);

const ButtonSchema = z.object({
    link: z.string(),
    type: z.enum(['external', 'subscriptionLink']),
    text: LocalizedTextSchema,
    svgIconKey: z.string(),
});

const BlockSchema = z.object({
    svgIconKey: z.string(),
    svgIconColor: z
        .string()
        .refine(
            (value) =>
                [
                    'blue',
                    'cyan',
                    'dark',
                    'grape',
                    'gray',
                    'green',
                    'indigo',
                    'lime',
                    'orange',
                    'pink',
                    'red',
                    'teal',
                    'violet',
                    'yellow',
                ].includes(value) || /^#[0-9a-fA-F]{3,8}$/.test(value),
            {
                message:
                    'svgIconColor must be one of the predefined colors or a hex color beginning with #',
            },
        ),
    title: LocalizedTextSchema,
    description: LocalizedTextSchema,
    buttons: z.array(ButtonSchema),
});

const PlatformAppSchema = z.object({
    name: z.string(),
    featured: z.boolean(),
    blocks: z.array(BlockSchema),
});

const PlatformSchema = z.object({
    displayName: LocalizedTextSchema,
    svgIconKey: z.string(),
    apps: z.array(PlatformAppSchema),
});

const BrandingSettingsSchema = z.object({
    title: z.string(),
    logoUrl: z.string(),
    supportUrl: z.string().url(),
});

const UiConfigSchema = z.object({
    subscriptionInfo: z.object({
        block: z.enum(['collapsed', 'expanded']),
    }),
    installationGuides: z.object({
        headerText: LocalizedTextSchema,
    }),
    connectionKeys: z.object({
        headerText: LocalizedTextSchema,
    }),
});

export const SubscriptionPageRawConfigSchema = z
    .object({
        version: z.nativeEnum(SUBSCRIPTION_PAGE_CONFIG_VERSION),
        additionalLocales: z.array(z.enum(SUBSCRIPTION_PAGE_CONFIG_ADDITIONAL_LOCALES)),
        brandingSettings: BrandingSettingsSchema,
        uiConfig: UiConfigSchema,
        svgLibrary: SvgLibrarySchema,
        platforms: z.record(z.nativeEnum(SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES), PlatformSchema),
    })
    .superRefine((data, ctx) => {
        validateLocalizedTexts(data.platforms, data.additionalLocales, 'platforms', ctx);
        validateSvgReferences(data, ctx);
    });

export type TSubscriptionPageSvgLibrary = z.infer<typeof SvgLibrarySchema>;
export type TSubscriptionPageRawConfig = z.infer<typeof SubscriptionPageRawConfigSchema>;
export type TSubscriptionPageBrandingSettings = z.infer<typeof BrandingSettingsSchema>;
export type TSubscriptionPagePlatformSchema = z.infer<typeof PlatformSchema>;
export type TSubscriptionPagePlatformKey = keyof TSubscriptionPageRawConfig['platforms'];
export type TSubscriptionPageAppConfig = z.infer<typeof PlatformAppSchema>;
export type TSubscriptionPageBlockConfig = z.infer<typeof BlockSchema>;
export type TSubscriptionPageButtonConfig = z.infer<typeof ButtonSchema>;
export type TSubscriptionPageLocalizedText = z.infer<typeof LocalizedTextSchema>;
export type TSubscriptionPageUiConfig = z.infer<typeof UiConfigSchema>;
export type TSubscriptionPageLocales =
    | TSubscriptionPageRawConfig['additionalLocales'][number]
    | 'en';
