export const SUBSCRIPTION_PAGE_CONFIG_VERSION = {
    1: '1',
} as const;

export const SUBSCRIPTION_PAGE_CONFIG_ADDITIONAL_LOCALES = ['ru', 'zh', 'fa', 'fr'] as const;

export const SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES = {
    IOS: 'ios',
    ANDROID: 'android',
    LINUX: 'linux',
    MACOS: 'macos',
    WINDOWS: 'windows',
    ANDROID_TV: 'androidTV',
    APPLE_TV: 'appleTV',
} as const;

export type TSubscriptionPageConfigAdditionalLocales =
    (typeof SUBSCRIPTION_PAGE_CONFIG_ADDITIONAL_LOCALES)[number];
