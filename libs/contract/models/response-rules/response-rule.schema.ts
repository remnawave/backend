import { z } from 'zod';

import {
    RESPONSE_RULES_CONDITION_OPERATORS,
    RESPONSE_RULES_OPERATORS,
    RESPONSE_RULES_RESPONSE_TYPES,
    RESPONSE_RULES_RESPONSE_TYPES_DESCRIPTION,
} from '../../constants';
import { ResponseRuleModificationsSchema } from './response-rule-modifications.schema';
import { ResponseRuleConditionSchema } from './response-rule-condition.schema';

const RuleExampleJson = JSON.stringify(
    {
        name: 'Block Legacy Clients',
        description: 'Block requests from legacy clients',
        enabled: true,
        operator: RESPONSE_RULES_OPERATORS.OR,
        conditions: [
            {
                headerName: 'user-agent',
                operator: RESPONSE_RULES_CONDITION_OPERATORS.CONTAINS,
                value: 'Hiddify',
                caseSensitive: true,
            },
            {
                headerName: 'user-agent',
                operator: RESPONSE_RULES_CONDITION_OPERATORS.CONTAINS,
                value: 'FoxRay',
                caseSensitive: true,
            },
        ],
        responseType: RESPONSE_RULES_RESPONSE_TYPES.BLOCK,
    },
    null,
    2,
);

export const ResponseRuleSchema = z
    .object({
        name: z
            .string()
            .min(1, 'Name is required')
            .max(50, 'Name must be less than 50 characters')
            .describe(
                JSON.stringify({
                    title: 'Name',
                    markdownDescription: 'Name of the response rule.',
                }),
            ),
        description: z
            .string()
            .min(1, 'Description is required')
            .max(250, 'Description must be less than 250 characters')
            .optional()
            .describe(
                JSON.stringify({
                    title: 'Description',
                    markdownDescription:
                        'Description of the response rule. Maximum length is 250 characters.',
                }),
            ),
        enabled: z.boolean().describe(
            JSON.stringify({
                markdownDescription:
                    'Whether the response rule is enabled. If disabled, the rule will not be applied.',
            }),
        ),
        operator: z.nativeEnum(RESPONSE_RULES_OPERATORS).describe(
            JSON.stringify({
                title: 'Operator',
                markdownDescription: 'Operator to use for combining conditions in the rule.',
            }),
        ),
        conditions: z.array(ResponseRuleConditionSchema),
        responseType: z.nativeEnum(RESPONSE_RULES_RESPONSE_TYPES).describe(
            JSON.stringify({
                markdownDescription: `Type of the response. Determines the type of **response** to be returned when the rule is matched.\n\n${Object.entries(
                    RESPONSE_RULES_RESPONSE_TYPES_DESCRIPTION,
                )
                    .map(([key, description]) => `- **${key}**: ${description}\n`)
                    .join('\n')}`,
            }),
        ),
        responseModifications: ResponseRuleModificationsSchema,
    })
    .describe(
        JSON.stringify({
            title: 'Response Rule',
            markdownDescription: `\n\nFields:\n- **name**: Name of the response rule (required)\n- **description**: Description of the response rule (optional)\n- **enabled**: Whether the response rule is enabled. If disabled, the rule will not be applied.\n- **operator**: Operator to combine conditions (AND/OR)\n- **conditions**: Array of conditions to match against HTTP headers\n  - **headerName**: Name of the HTTP header to check (case insensitive)\n  - **operator**: Comparison operator (CONTAINS, EQUALS, etc)\n  - **value**: Value to compare against (case sensitive, max 255 chars)\n- **responseType**: Type of response when rule matches (e.g. BLOCK)\n\nExample:\n\`\`\`json\n${RuleExampleJson}\n\`\`\``,
            examples: [
                {
                    name: 'This is example rule name',
                    description: 'This is example rule description (optional)',
                    enabled: true,
                    operator: RESPONSE_RULES_OPERATORS.AND,
                    conditions: [
                        {
                            headerName: 'user-agent',
                            operator: RESPONSE_RULES_CONDITION_OPERATORS.CONTAINS,
                            value: 'Example Rule Value, replace with your own value',
                            caseSensitive: true,
                        },
                    ],
                    responseType: RESPONSE_RULES_RESPONSE_TYPES.BLOCK,
                },
                {
                    name: 'Empty rule',
                    enabled: true,
                    operator: RESPONSE_RULES_OPERATORS.AND,
                    conditions: [],
                    responseType: RESPONSE_RULES_RESPONSE_TYPES.BLOCK,
                },
            ],
        }),
    );
