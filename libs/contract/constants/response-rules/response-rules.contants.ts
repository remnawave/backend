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
    [RESPONSE_RULES_RESPONSE_TYPES.XRAY_JSON]:
        'Return **subscription** in XRAY-JSON format. (Using `Xray Json` template)',
    [RESPONSE_RULES_RESPONSE_TYPES.XRAY_BASE64]:
        'Return **subscription** in BASE64 encoded string. Compatible with most client application with Xray core.',
    [RESPONSE_RULES_RESPONSE_TYPES.MIHOMO]:
        'Return **subscription** in Mihomo format. (Using `Mihomo` template)',
    [RESPONSE_RULES_RESPONSE_TYPES.STASH]:
        'Return **subscription** in Stash format. (Using `Stash` template)',
    [RESPONSE_RULES_RESPONSE_TYPES.CLASH]:
        'Return **subscription** in Clash format. (Using `Clash` template) Useful for client application that use Legacy Clash core.',
    [RESPONSE_RULES_RESPONSE_TYPES.SINGBOX]:
        'Return **subscription** in Singbox format. (Using `Singbox` template) Format which is used by Singbox client application.',
    [RESPONSE_RULES_RESPONSE_TYPES.BROWSER]:
        'Return **subscription** as browser format. The same as on `/info` route.',
    [RESPONSE_RULES_RESPONSE_TYPES.BLOCK]: '**Drop** request and return `403` status code.',
    [RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_404]:
        '**Drop** request and return `404` status code.',
    [RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_451]:
        '**Drop** request and return `451` status code.',
    [RESPONSE_RULES_RESPONSE_TYPES.SOCKET_DROP]: '**Drop** the socket connection.',
} as const;

export const RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION = {
    [RESPONSE_RULES_CONDITION_OPERATORS.EQUALS]:
        'Performs an exact, comparison between the header value and specified string. `string === value`',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_EQUALS]:
        'Ensures the header value does not exactly match the specified string. `string !== value`',
    [RESPONSE_RULES_CONDITION_OPERATORS.CONTAINS]:
        'Checks if the header value contains the specified string as a substring. `string.includes()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_CONTAINS]:
        'Verifies the header value does not contain the specified string as a substring. `!string.includes()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.STARTS_WITH]:
        'Validates that the header value begins with the specified string. `string.startsWith()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_STARTS_WITH]:
        'Validates that the header value does not begin with the specified string. `!string.startsWith()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.ENDS_WITH]:
        'Confirms the header value ends with the specified string. `string.endsWith()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_ENDS_WITH]:
        'Confirms the header value does not end with the specified string. `!string.endsWith()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.REGEX]:
        'Evaluates if the header value matches the specified regular expression pattern. `regex.test()`',
    [RESPONSE_RULES_CONDITION_OPERATORS.NOT_REGEX]:
        'Evaluates if the header value does not match the specified regular expression pattern. `!regex.test()`',
} as const;
