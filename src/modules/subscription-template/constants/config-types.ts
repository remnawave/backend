import {
    RESPONSE_RULES_RESPONSE_TYPES,
    TResponseRulesResponseType,
} from '@libs/contracts/constants';

export const SUBSCRIPTION_CONFIG_TYPES: Record<
    TResponseRulesResponseType,
    { CONTENT_TYPE: string; isBase64: boolean }
> = {
    [RESPONSE_RULES_RESPONSE_TYPES.MIHOMO]: {
        CONTENT_TYPE: 'text/yaml',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.CLASH]: {
        CONTENT_TYPE: 'text/yaml',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.STASH]: {
        CONTENT_TYPE: 'text/yaml',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.SINGBOX]: {
        CONTENT_TYPE: 'application/json',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.XRAY_BASE64]: {
        CONTENT_TYPE: 'text/plain',
        isBase64: true,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.XRAY_JSON]: {
        CONTENT_TYPE: 'application/json',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.BLOCK]: {
        CONTENT_TYPE: 'text/plain',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_404]: {
        CONTENT_TYPE: 'text/plain',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_451]: {
        CONTENT_TYPE: 'text/plain',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.SOCKET_DROP]: {
        CONTENT_TYPE: 'text/plain',
        isBase64: false,
    },
    [RESPONSE_RULES_RESPONSE_TYPES.BROWSER]: {
        CONTENT_TYPE: 'text/html',
        isBase64: false,
    },
} as const;

export type TSubscriptionConfigTypes = [keyof typeof SUBSCRIPTION_CONFIG_TYPES][number];
export const SUBSCRIPTION_CONFIG_TYPES_VALUES = Object.values(SUBSCRIPTION_CONFIG_TYPES);
