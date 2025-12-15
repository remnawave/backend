export const SUBSCRIPTION_PAGE_CONFIG_VERSION = {
    1: '1',
} as const;

export type TSubscriptionPageConfigVersion =
    (typeof SUBSCRIPTION_PAGE_CONFIG_VERSION)[keyof typeof SUBSCRIPTION_PAGE_CONFIG_VERSION];

export const SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES = {
    IOS: 'ios',
    ANDROID: 'android',
    LINUX: 'linux',
    MACOS: 'macos',
    WINDOWS: 'windows',
    ANDROID_TV: 'androidTV',
    APPLE_TV: 'appleTV',
} as const;

export type TSubscriptionPageConfigPlatformType =
    (typeof SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES)[keyof typeof SUBSCRIPTION_PAGE_CONFIG_PLATFORM_TYPES];
