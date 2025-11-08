export const REQUEST_TEMPLATE_TYPE = {
    STASH: 'stash',
    SINGBOX: 'singbox',
    MIHOMO: 'mihomo',
    XRAY_JSON: 'json',
    V2RAY_JSON: 'v2ray-json',
    CLASH: 'clash',
} as const;

export type TRequestTemplateType = [keyof typeof REQUEST_TEMPLATE_TYPE][number];
export const REQUEST_TEMPLATE_TYPE_VALUES = Object.values(REQUEST_TEMPLATE_TYPE);
export type TRequestTemplateTypeKeys =
    (typeof REQUEST_TEMPLATE_TYPE)[keyof typeof REQUEST_TEMPLATE_TYPE];
