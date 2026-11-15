import { z } from 'zod';

import {
    RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION,
    RESPONSE_RULES_OPERATORS,
    RESPONSE_RULES_PRESENCE_CONDITION_OPERATORS,
    RESPONSE_RULES_STRING_CONDITION_OPERATORS,
    RESPONSE_RULES_VERSION_CONDITION_OPERATORS,
} from '../../constants';

const describeOperators = (
    operators: Record<string, keyof typeof RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION>,
) =>
    Object.values(operators).map(
        (operator) => RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION[operator],
    );

const buildHeaderNameSchema = () =>
    z
        .string()
        .regex(
            /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/,
            'Invalid header name. Only letters(a-z, A-Z), numbers(0-9), underscores(_) and hyphens(-) are allowed.',
        )
        .meta({
            title: 'Header Name',
            markdownDescription: '**Name** of the HTTP header to check. Must comply with RFC 7230.',
        });

const buildStringValueSchema = () =>
    z.string().min(1, 'Value is required').max(255, 'Value must be less than 255 characters');

export const ResponseRuleStringConditionSchema = z
    .object({
        headerName: buildHeaderNameSchema(),
        operator: z.enum(RESPONSE_RULES_STRING_CONDITION_OPERATORS).meta({
            errorMessage: 'Invalid operator. Please select a valid operator.',
            markdownDescription: 'Operator to use for comparing the `headerName` with `value`.',
            markdownEnumDescriptions: describeOperators(RESPONSE_RULES_STRING_CONDITION_OPERATORS),
        }),
        value: z
            .union([
                buildStringValueSchema(),
                z
                    .array(buildStringValueSchema())
                    .min(1, 'At least one value is required')
                    .max(100, 'No more than 100 values are allowed'),
            ])
            .meta({
                markdownDescription: [
                    '**Value** to check against the **headerName** – a string or a list of strings.',
                    '',
                    'With a list, positive operators match when **any** value matches. `NOT_` operators match when **none** of them does: `NOT_CONTAINS ["a", "b"]` means the header contains neither `a` nor `b`.',
                    '',
                    '`caseSensitive` applies to every value in the list.',
                ].join('\n'),
            }),
        caseSensitive: z.boolean().optional().meta({
            markdownDescription:
                'Whether the value is **case sensitive**. Optional, `false` by default. \n\n - `true`: the value will be compared as is. \n\n - `false`: the header and the value are compared ignoring case. Regular expressions get the `i` flag instead, so escapes like `\\S` or `\\D` keep their meaning.',
        }),
    })
    .meta({
        title: 'String condition',
        markdownDescription: [
            'Compares the value of **headerName** with `value`.',
            '',
            '> A missing header never matches – not even `NOT_EQUALS`, `NOT_CONTAINS` and the other `NOT_` operators. Combine them with `NOT_EXISTS` in an `OR` group to match requests without the header too.',
        ].join('\n'),
        defaultSnippets: [
            {
                label: 'Examples: Check if header contains "text/html"',
                markdownDescription: 'Condition to check if **headerName** contains "text/html"',
                body: {
                    headerName: 'accept',
                    operator: 'CONTAINS',
                    value: 'text/html',
                    caseSensitive: true,
                },
            },
            {
                label: 'Examples: Header starts with any of several values',
                markdownDescription:
                    'Condition to check if **user-agent** starts with any of the listed values',
                body: {
                    headerName: 'user-agent',
                    operator: 'STARTS_WITH',
                    value: ['Wget', 'python-requests', 'Go-http-client'],
                },
            },
        ],
    });

export const ResponseRuleVersionConditionSchema = z
    .strictObject({
        headerName: buildHeaderNameSchema(),
        operator: z.enum(RESPONSE_RULES_VERSION_CONDITION_OPERATORS).meta({
            errorMessage: 'Invalid operator. Please select a valid operator.',
            markdownDescription:
                'Operator to use for comparing the version from `headerName` with `value`.',
            markdownEnumDescriptions: describeOperators(RESPONSE_RULES_VERSION_CONDITION_OPERATORS),
        }),
        value: z
            .string()
            .regex(/^\d+(\.\d+){0,3}$/, 'Version must look like 1, 1.4, 1.4.2 or 1.4.2.7')
            .meta({
                title: 'Version',
                markdownDescription:
                    'The **version** to compare with. Up to four numeric parts, missing parts count as `0`.',
                examples: ['1.4.2', '2.0'],
            }),
        versionPattern: z
            .string()
            .min(1)
            .max(255)
            .optional()
            .meta({
                title: 'Version pattern',
                markdownDescription: [
                    'Regular expression with a **capture group** that extracts the version from the header. Matched case-insensitively.',
                    '',
                    'Without it the whole header value is treated as the version – handy for headers like `x-app-version: 1.4.2`.',
                    '',
                    'A leading `v` and anything after the numeric part are ignored: `v1.4.2-beta` reads as `1.4.2`.',
                    '',
                    '> If the pattern does not match, or the captured text is not a version, the condition does **not** match – for every operator, including `VERSION_LT`.',
                ].join('\n'),
                examples: ['Happ/([\\d.]+)', 'Streisand/([\\d.]+)'],
            }),
    })
    .meta({
        title: 'Version condition',
        markdownDescription:
            'Extracts a version from **headerName** and compares it with `value` numerically, part by part.',
        defaultSnippets: [
            {
                label: 'Examples: Client version below 1.4.0',
                markdownDescription: 'Matches Happ clients older than **1.4.0**',
                body: {
                    headerName: 'user-agent',
                    operator: 'VERSION_LT',
                    value: '1.4.0',
                    versionPattern: 'Happ/([\\d.]+)',
                },
            },
        ],
    });

export const ResponseRulePresenceConditionSchema = z
    .strictObject({
        headerName: buildHeaderNameSchema(),
        operator: z.enum(RESPONSE_RULES_PRESENCE_CONDITION_OPERATORS).meta({
            errorMessage: 'Invalid operator. Please select a valid operator.',
            markdownDescription: 'Checks whether `headerName` is sent at all.',
            markdownEnumDescriptions: describeOperators(
                RESPONSE_RULES_PRESENCE_CONDITION_OPERATORS,
            ),
        }),
    })
    .meta({
        title: 'Presence condition',
        markdownDescription: [
            'Checks whether **headerName** is present in the request. A header with an empty value counts as present.',
            '',
            '> Headers injected by Remnawave itself, such as `x-remnawave-injected-short-uuid`, are always present.',
        ].join('\n'),
        defaultSnippets: [
            {
                label: 'Examples: Request without HWID',
                markdownDescription: 'Matches requests that do not send the `x-hwid` header',
                body: {
                    headerName: 'x-hwid',
                    operator: 'NOT_EXISTS',
                },
            },
        ],
    });

export const ResponseRuleConditionSchema = z
    .discriminatedUnion('operator', [
        ResponseRuleStringConditionSchema,
        ResponseRuleVersionConditionSchema,
        ResponseRulePresenceConditionSchema,
    ])
    .meta({
        markdownDescription: 'Condition to check against the **headerName**.',
    });

export const ResponseRuleConditionGroupSchema = z
    .strictObject({
        operator: z.enum(RESPONSE_RULES_OPERATORS).meta({
            markdownDescription: 'Operator to use for combining conditions in the group.',
        }),
        get conditions(): z.ZodArray<typeof ResponseRuleConditionNodeSchema> {
            return z.array(ResponseRuleConditionNodeSchema).min(1).meta({
                title: 'Conditions',
                markdownDescription:
                    'Conditions and nested groups, combined with **operator**. A group cannot be empty.',
            });
        },
    })
    .meta({
        title: 'Condition group',
        markdownDescription: [
            'Combines conditions with its own **operator**, so `AND` and `OR` can be mixed in one rule.',
            '',
            'Groups can be nested up to 3 levels deep.',
        ].join('\n'),
        defaultSnippets: [
            {
                label: 'Examples: Any of several clients',
                markdownDescription: 'Matches Happ **or** Streisand',
                body: {
                    operator: 'OR',
                    conditions: [
                        {
                            headerName: 'user-agent',
                            operator: 'CONTAINS',
                            value: 'happ',
                        },
                        {
                            headerName: 'user-agent',
                            operator: 'CONTAINS',
                            value: 'streisand',
                        },
                    ],
                },
            },
        ],
    });

export const ResponseRuleConditionNodeSchema: z.ZodDiscriminatedUnion<
    [
        typeof ResponseRuleStringConditionSchema,
        typeof ResponseRuleVersionConditionSchema,
        typeof ResponseRulePresenceConditionSchema,
        typeof ResponseRuleConditionGroupSchema,
    ],
    'operator'
> = z.discriminatedUnion('operator', [
    ResponseRuleStringConditionSchema,
    ResponseRuleVersionConditionSchema,
    ResponseRulePresenceConditionSchema,
    ResponseRuleConditionGroupSchema,
]);
