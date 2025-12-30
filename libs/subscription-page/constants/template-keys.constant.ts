export const SUBSCRIPTION_PAGE_TEMPLATE_KEYS = [
    'USERNAME',
    'SUBSCRIPTION_LINK',
    'HAPP_CRYPT3_LINK',
    'HAPP_CRYPT4_LINK',
] as const;
export type TSubscriptionPageTemplateKey = (typeof SUBSCRIPTION_PAGE_TEMPLATE_KEYS)[number];
