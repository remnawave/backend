import { z } from 'zod';

import {
    SUBSCRIPTION_PAGE_CONFIG_VERSION,
    SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES,
    SUBSCRIPTION_INFO_BLOCK_VARIANTS,
    INSTALLATION_GUIDE_BLOCKS_VARIANTS,
    BUTTON_TYPES,
    LANGUAGE_CODES,
} from '../constants';
import {
    validateLocalizedTexts,
    validateSvgReferences,
} from './subscription-page-config.validator';

const LocalizedTextSchema = z
    .record(z.string().regex(/^[a-z]{2}$/, 'Language code must be 2 lowercase letters'), z.string())
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'At least one language must be specified',
    });

const SvgLibrarySchema = z.record(
    z.string().regex(/^[A-Za-z]+$/, { message: 'Only latin characters, no spaces allowed' }),
    z.string(),
);

const ButtonSchema = z.object({
    link: z.string(),
    type: z.nativeEnum(BUTTON_TYPES),
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
    svgIconKey: z.optional(z.string()),
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
    subscriptionInfoBlockType: z.nativeEnum(SUBSCRIPTION_INFO_BLOCK_VARIANTS),
    installationGuidesBlockType: z.nativeEnum(INSTALLATION_GUIDE_BLOCKS_VARIANTS),
});

const SubscriptionPageTranslateKeysSchema = z.object({
    installationGuideHeader: LocalizedTextSchema,
    connectionKeysHeader: LocalizedTextSchema,
    linkCopied: LocalizedTextSchema,
    linkCopiedToClipboard: LocalizedTextSchema,
    getLink: LocalizedTextSchema,
    scanQrCode: LocalizedTextSchema,
    scanQrCodeDescription: LocalizedTextSchema,
    copyLink: LocalizedTextSchema,
    name: LocalizedTextSchema,
    status: LocalizedTextSchema,
    active: LocalizedTextSchema,
    inactive: LocalizedTextSchema,
    expires: LocalizedTextSchema,
    bandwidth: LocalizedTextSchema,
    scanToImport: LocalizedTextSchema,
    expiresIn: LocalizedTextSchema,
    expired: LocalizedTextSchema,
    unknown: LocalizedTextSchema,
    indefinitely: LocalizedTextSchema,
});

export const SubscriptionPageRawConfigSchema = z
    .object({
        version: z.nativeEnum(SUBSCRIPTION_PAGE_CONFIG_VERSION),
        locales: z.array(z.enum(LANGUAGE_CODES)).min(1, 'At least one locale must be specified'),
        brandingSettings: BrandingSettingsSchema,
        uiConfig: UiConfigSchema,
        baseTranslations: SubscriptionPageTranslateKeysSchema,
        svgLibrary: SvgLibrarySchema,
        platforms: z.record(z.nativeEnum(SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES), PlatformSchema),
    })
    .superRefine((data, ctx) => {
        validateLocalizedTexts(data, data.locales, ctx);
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
export type TSubscriptionPageTranslateKeys = z.infer<typeof SubscriptionPageTranslateKeysSchema>;
export type TSubscriptionPageBaseTranslationKeys = keyof TSubscriptionPageTranslateKeys;
