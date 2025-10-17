import { z } from 'zod';

import {
    RESPONSE_RULES_CONDITION_OPERATORS,
    RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION,
} from '../../constants';

export const ResponseRuleConditionSchema = z.object({
    headerName: z
        .string()
        .regex(
            /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/,
            'Invalid header name. Only letters(a-z, A-Z), numbers(0-9), underscores(_) and hyphens(-) are allowed.',
        )
        .describe(
            JSON.stringify({
                title: 'Header Name',
                markdownDescription:
                    'Name of the HTTP header to check, case insensitive, must comply with RFC 7230.',
            }),
        ),
    operator: z.nativeEnum(RESPONSE_RULES_CONDITION_OPERATORS).describe(
        JSON.stringify({
            markdownDescription: `Comparison operator to compare the header value against.\n\n${Object.entries(
                RESPONSE_RULES_CONDITION_OPERATORS_DESCRIPTION,
            )
                .map(([key, description]) => `- **${key}**: ${description}\n`)
                .join('\n')}`,
        }),
    ),
    value: z
        .string()
        .min(1, 'Value is required')
        .max(255, 'Value must be less than 255 characters')
        .describe(
            JSON.stringify({
                markdownDescription: `Value to check against the header, case sensitive (excluding regex/not_regex operator). Maximum length is 255 characters.`,
            }),
        ),
    caseSensitive: z.boolean().describe(
        JSON.stringify({
            markdownDescription:
                'Whether the value is case sensitive. If true, the value will be compared case sensitive. If false, the value will be lowercased before comparison.',
        }),
    ),
});
