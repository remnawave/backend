import { SUBSCRIPTION_TEMPLATE_TYPE } from '../subscription-template';

export const RESPONSE_RULES_CONFIG_VERSION = {
    1: '1',
} as const;

export const RESPONSE_RULES_OPERATORS = {
    AND: 'AND',
    OR: 'OR',
} as const;

export const RESPONSE_RULE_CONDITION_TYPES = {
    HEADER: 'HEADER',
} as const;

export const RESPONSE_RULES_CONDITION_OPERATORS = {
    EQUALS: 'EQUALS',
    NOT_EQUALS: 'NOT_EQUALS',
    CONTAINS: 'CONTAINS',
    NOT_CONTAINS: 'NOT_CONTAINS',
    STARTS_WITH: 'STARTS_WITH',
    NOT_STARTS_WITH: 'NOT_STARTS_WITH',
    ENDS_WITH: 'ENDS_WITH',
    NOT_ENDS_WITH: 'NOT_ENDS_WITH',
    REGEX: 'REGEX',
    NOT_REGEX: 'NOT_REGEX',
} as const;

export const RESPONSE_RULES_RESPONSE_TYPES = {
    ...SUBSCRIPTION_TEMPLATE_TYPE,
    BROWSER: 'BROWSER',
    BLOCK: 'BLOCK',
    STATUS_CODE_404: 'STATUS_CODE_404',
    STATUS_CODE_451: 'STATUS_CODE_451',
    SOCKET_DROP: 'SOCKET_DROP',
} as const;

export type TResponseRulesResponseType = [keyof typeof RESPONSE_RULES_RESPONSE_TYPES][number];
export const RESPONSE_RULES_RESPONSE_TYPES_VALUES = Object.values(RESPONSE_RULES_RESPONSE_TYPES);
export type TResponseRulesResponseTypeKeys =
    (typeof RESPONSE_RULES_RESPONSE_TYPES)[keyof typeof RESPONSE_RULES_RESPONSE_TYPES];

export type TResponseRulesConditionOperator = [
    keyof typeof RESPONSE_RULES_CONDITION_OPERATORS,
][number];
export const RESPONSE_RULES_CONDITION_OPERATORS_VALUES = Object.values(
    RESPONSE_RULES_CONDITION_OPERATORS,
);
export type TResponseRulesConditionOperatorKeys =
    (typeof RESPONSE_RULES_CONDITION_OPERATORS)[keyof typeof RESPONSE_RULES_CONDITION_OPERATORS];

export const RESPONSE_RULES_RESPONSE_TYPES_DESCRIPTION = {
    [RESPONSE_RULES_RESPONSE_TYPES.BLOCK]:
        'Block response type blocks the request and returns a 403 status code.',
    [RESPONSE_RULES_RESPONSE_TYPES.XRAY_BASE64]:
        'Previously used as fallback response type. It return subscription as base64 encoded string. Compatible with most client application with Xray core.',
    [RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_404]:
        'Status code 404 response type returns a 404 status code. This response type is used to return a 404 status code.',
    [RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_451]:
        'Status code 451 response type returns a 451 status code. This response type is used to return a 451 status code.',
    [RESPONSE_RULES_RESPONSE_TYPES.SOCKET_DROP]:
        'Socket drop response type drops the socket connection. This response type is used to drop the socket connection.',
    [RESPONSE_RULES_RESPONSE_TYPES.CLASH]:
        'Useful for client application that use Legacy Clash core. It return subscription as Clash YAML format.',
    [RESPONSE_RULES_RESPONSE_TYPES.STASH]: 'Format which is used by Stash client application.',
    [RESPONSE_RULES_RESPONSE_TYPES.SINGBOX]: 'Format which is used by Singbox client application.',
    [RESPONSE_RULES_RESPONSE_TYPES.MIHOMO]: 'Return subscription as Mihomo Core YAML format.',
    [RESPONSE_RULES_RESPONSE_TYPES.XRAY_JSON]: 'Return subscription as Xray JSON format.',
    [RESPONSE_RULES_RESPONSE_TYPES.BROWSER]: 'Return subscription as browser format.',
} as const;

export const RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION = {
    [RESPONSE_RULES_CONDITION_OPERATORS.EQUALS]:
        'Equals operator checks if the header value exactly matches the specified string, case sensitive. Underlying implementation uses strict string comparison – ===.',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_EQUALS]:
        'Not equals operator checks if the header value does not match the specified string, case sensitive. Underlying implementation uses strict string comparison – !==.',
    [RESPONSE_RULES_CONDITION_OPERATORS.CONTAINS]:
        'Contains operator checks if the header value contains the specified string, case sensitive. Underlying implementation uses string.includes().',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_CONTAINS]:
        'Not contains operator checks if the header value does not contain the specified string, case sensitive. Underlying implementation uses string.includes().',
    [RESPONSE_RULES_CONDITION_OPERATORS.STARTS_WITH]:
        'Starts with operator checks if the header value starts with the specified string, case sensitive. Underlying implementation uses string.startsWith().',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_STARTS_WITH]:
        'Not starts with operator checks if the header value does not start with the specified string, case sensitive. Underlying implementation uses string.startsWith().',
    [RESPONSE_RULES_CONDITION_OPERATORS.ENDS_WITH]:
        'Ends with operator checks if the header value ends with the specified string, case sensitive. Underlying implementation uses string.endsWith().',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_ENDS_WITH]:
        'Not ends with operator checks if the header value does not end with the specified string, case sensitive. Underlying implementation uses string.endsWith().',
    [RESPONSE_RULES_CONDITION_OPERATORS.REGEX]:
        'Regex operator checks if the header value matches the specified regex. Underlying implementation uses regex.test().',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_REGEX]:
        'Inverse regex operator checks if the header value does not match the specified regex. Underlying implementation uses regex.test().',
} as const;
