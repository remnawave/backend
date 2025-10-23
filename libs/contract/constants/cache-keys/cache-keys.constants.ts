import { TSubscriptionTemplateType } from '../subscription-template';

export const CACHE_KEYS = {
    SUBSCRIPTION_SETTINGS: 'subscription_settings',
    SUBSCRIPTION_TEMPLATE: (name: string, type: TSubscriptionTemplateType) =>
        `subscription_template:${name}:${type}`,
    PASSKEY_REGISTRATION_OPTIONS: (uuid: string) => `passkey_registration_options:${uuid}`,
    PASSKEY_AUTHENTICATION_OPTIONS: (uuid: string) => `passkey_authentication_options:${uuid}`,
    REMNAWAVE_SETTINGS: 'remnawave_settings',
} as const;

export const CACHE_KEYS_TTL = {
    REMNAWAVE_SETTINGS: 86_400_000, // 1 day
} as const;
