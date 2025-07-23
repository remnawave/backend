export const SUBSCRIPTION_CONFIG_TYPES = {
    MIHOMO: {
        NAME: 'MIHOMO',
        REGEX: /^(?:FlClash|FlClashX|[Cc]lash-[Vv]erge|[Kk]oala-[Cc]lash|[Cc]lash-?[Mm]eta|[Mm]urge|[Cc]lashX [Mm]eta|[Mm]ihomo|[Cc]lash-nyanpasu|clash\.meta)/,
        CONTENT_TYPE: 'text/yaml',
        BASE64: false,
    },
    CLASH: {
        NAME: 'CLASH',
        REGEX: /^[Cc]lash/,
        CONTENT_TYPE: 'text/yaml',
        BASE64: false,
    },
    STASH: {
        NAME: 'STASH',
        REGEX: /^[Ss]tash/,
        CONTENT_TYPE: 'text/yaml',
        BASE64: false,
    },
    SING_BOX: {
        NAME: 'SING_BOX',
        REGEX: /^(SFA|SFI|SFM|SFT|[Kk]aring|Singbox|[Rr]abbit[Hh]ole)/,
        CONTENT_TYPE: 'application/json',
        BASE64: false,
    },
    OUTLINE: {
        NAME: 'OUTLINE',
        REGEX: /^(SS|SSR|SSD|SSS|Outline|Shadowsocks|SSconf)/,
        CONTENT_TYPE: 'application/json',
        BASE64: false,
    },
    XRAY: {
        NAME: 'XRAY',
        REGEX: null,
        CONTENT_TYPE: 'text/plain',
        BASE64: true,
    },
    XRAY_JSON: {
        NAME: 'XRAY_JSON',
        REGEX: null,
        CONTENT_TYPE: 'application/json',
        BASE64: false,
    },
} as const;

export type TSubscriptionConfigTypes = [keyof typeof SUBSCRIPTION_CONFIG_TYPES][number];
export const SUBSCRIPTION_CONFIG_TYPES_VALUES = Object.values(SUBSCRIPTION_CONFIG_TYPES);
