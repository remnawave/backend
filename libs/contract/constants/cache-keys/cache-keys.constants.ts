import { TSubscriptionTemplateType } from '../subscription-template';

export const CACHE_KEYS = {
    SUBSCRIPTION_SETTINGS: 'subscription_settings',
    EXTERNAL_SQUAD_SETTINGS: (uuid: string) => `external_squad_settings:${uuid}`,
    SUBSCRIPTION_TEMPLATE: (name: string, type: TSubscriptionTemplateType) =>
        `subscription_template:${name}:${type}`,
    PASSKEY_REGISTRATION_OPTIONS: (uuid: string) => `passkey_registration_options:${uuid}`,
    PASSKEY_AUTHENTICATION_OPTIONS: (uuid: string) => `passkey_authentication_options:${uuid}`,
    REMNAWAVE_SETTINGS: 'remnawave_settings',
    SHORT_UUID_RANGE: 'short_uuid_range',
} as const;

export const CACHE_KEYS_TTL = {
    REMNAWAVE_SETTINGS: 86_400_000, // 1 day
    EXTERNAL_SQUAD_SETTINGS: 3_600_000, // 1 hour
    SUBSCRIPTION_SETTINGS: 3_600_000, // 1 hour
    SHORT_UUID_RANGE: 86_400_000, // 1 day
} as const;

export const INTERNAL_CACHE_KEYS = {
    NODE_USER_USAGE_PREFIX: 'node_user_usage:',
    NODE_USER_USAGE: (nodeId: bigint) =>
        `${INTERNAL_CACHE_KEYS.NODE_USER_USAGE_PREFIX}${nodeId.toString()}`,
    NODE_USER_USAGE_KEYS: 'node_user_usage_keys',
    PROCESSING_POSTFIX: ':processing',
} as const;

export const INTERNAL_CACHE_KEYS_TTL = {
    NODE_USER_USAGE: 10_800, // 3 hours in seconds
} as const;
