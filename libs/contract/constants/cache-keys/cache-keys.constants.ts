import { TSubscriptionTemplateType } from '../subscription-template';

export const CACHE_KEYS = {
    SUBSCRIPTION_SETTINGS: 'subscription_settings',
    EXTERNAL_SQUAD_SETTINGS: (uuid: string) => `external_squad_settings:${uuid}`,
    SUBSCRIPTION_TEMPLATE: (name: string, type: TSubscriptionTemplateType) =>
        `subscription_template:${name}:${type}`,
    PASSKEY_REGISTRATION_OPTIONS: (uuid: string) => `passkey_registration_options:${uuid}`,
    PASSKEY_AUTHENTICATION_OPTIONS: (uuid: string) => `passkey_authentication_options:${uuid}`,
    REMNAWAVE_SETTINGS: 'remnawave_settings',
    NODE_SYSTEM_INFO: (uuid: string) => `node_system_info:${uuid}`,
    NODE_SYSTEM_STATS: (uuid: string) => `node_system_stats:${uuid}`,
    NODE_USERS_ONLINE: (uuid: string) => `node_users_online:${uuid}`,
    NODE_VERSIONS: (uuid: string) => `node_versions:${uuid}`,
    NODE_XRAY_UPTIME: (uuid: string) => `node_xray_uptime:${uuid}`,
} as const;

export const CACHE_KEYS_TTL = {
    REMNAWAVE_SETTINGS: 86_400, // 1 day
    EXTERNAL_SQUAD_SETTINGS: 3_600, // 1 hour
    SUBSCRIPTION_SETTINGS: 3_600, // 1 hour
    NODE_SYSTEM_STATS: 30, // 30 seconds
    NODE_USERS_ONLINE: 16, // 16 seconds
    NODE_XRAY_UPTIME: 16, // 16 seconds
} as const;

export const INTERNAL_CACHE_KEYS = {
    NODE_USER_USAGE_PREFIX: 'node_user_usage:',
    NODE_USER_USAGE: (nodeId: bigint) =>
        `${INTERNAL_CACHE_KEYS.NODE_USER_USAGE_PREFIX}${nodeId.toString()}`,
    NODE_USER_USAGE_KEYS: 'node_user_usage_keys',
    PROCESSING_POSTFIX: ':processing',
    RUNTIME_METRICS: 'runtime_metrics',
} as const;

export const INTERNAL_CACHE_KEYS_TTL = {
    NODE_USER_USAGE: 10_800, // 3 hours in seconds
} as const;
