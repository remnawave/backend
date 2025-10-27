export const TEMPLATE_KEYS = [
    'DAYS_LEFT',
    'TRAFFIC_USED',
    'TRAFFIC_LEFT',
    'STATUS',
    'TOTAL_TRAFFIC',
    'USERNAME',
    'EMAIL',
    'TELEGRAM_ID',
    'SUBSCRIPTION_URL',
    'TAG',
    'EXPIRE_UNIX',
] as const;
export type TemplateKeys = (typeof TEMPLATE_KEYS)[number];
