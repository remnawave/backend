export const SUBSCRIPTION_TEMPLATE_TYPE = {
    XRAY_JSON: 'XRAY_JSON',
    XRAY_BASE64: 'XRAY_BASE64',
    MIHOMO: 'MIHOMO',

    STASH: 'STASH',
    CLASH: 'CLASH',

    SINGBOX: 'SINGBOX',
} as const;

export type TSubscriptionTemplateType = [keyof typeof SUBSCRIPTION_TEMPLATE_TYPE][number];
export const SUBSCRIPTION_TEMPLATE_TYPE_VALUES = Object.values(SUBSCRIPTION_TEMPLATE_TYPE);
