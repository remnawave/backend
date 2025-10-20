import { TSubscriptionTemplateType } from '../subscription-template';

export const CACHE_KEYS = {
    SUBSCRIPTION_SETTINGS: 'subscription_settings',
    SUBSCRIPTION_TEMPLATE: (name: string, type: TSubscriptionTemplateType) =>
        `subscription_template:${name}:${type}`,
} as const;
