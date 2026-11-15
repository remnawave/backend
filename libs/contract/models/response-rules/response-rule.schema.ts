import { z } from 'zod';

import {
    RESPONSE_RULES_OPERATORS,
    RESPONSE_RULES_RESPONSE_TYPES,
    RESPONSE_RULES_RESPONSE_TYPES_DESCRIPTION,
} from '../../constants';
import { ResponseRuleConditionNodeSchema } from './response-rule-condition.schema';
import { ResponseRuleModificationsSchema } from './response-rule-modifications.schema';
import {
    EXAMPLES_SRR_BLANK_RULE,
    EXAMPLES_SRR_BLOCK_LEGACY_CLIENTS_RULE,
    generateResponseRuleDescription,
} from './response-rules-examples';

export const ResponseRuleSchemaBase = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(50, 'Name must be less than 50 characters')
        .meta({
            title: 'Name',
            markdownDescription: 'Name of the response rule.',
        }),
    description: z
        .string()
        .min(1, 'Description is required')
        .max(250, 'Description must be less than 250 characters')
        .optional()
        .meta({
            title: 'Description',
            markdownDescription: 'Description of the response rule. Optional.',
        }),
    enabled: z.boolean().meta({
        title: 'Enabled',
        markdownDescription:
            'Control whether the response rule is enabled or disabled. \n\n - `true` the rule will be applied. \n\n - `false` the rule will be always ignored.',
    }),
    operator: z.enum(RESPONSE_RULES_OPERATORS).meta({
        markdownDescription: 'Operator to use for combining conditions in the rule.',
    }),
    conditions: z.array(ResponseRuleConditionNodeSchema).meta({
        title: 'Conditions',
        markdownDescription:
            'Array of conditions and condition groups to check against the request headers. Conditions are applied with **operator**. If conditions are empty, the rule will be matched.',
    }),
    responseType: z.enum(RESPONSE_RULES_RESPONSE_TYPES).meta({
        errorMessage: 'Invalid response type. Please select a valid response type.',
        markdownDescription: `Type of the response. Determines the type of **response** to be returned when the rule is matched.`,
        markdownEnumDescriptions: Object.entries(RESPONSE_RULES_RESPONSE_TYPES_DESCRIPTION).map(
            ([_key, description]) => description,
        ),
    }),
    responseModifications: ResponseRuleModificationsSchema,
});

export const ResponseRuleSchema = ResponseRuleSchemaBase.meta({
    title: 'Response Rule',
    markdownDescription: generateResponseRuleDescription(ResponseRuleSchemaBase),
    defaultSnippets: [
        {
            label: 'Examples: Blank rule',
            markdownDescription: `Simple blank rule with no conditions or modifications.\n\`\`\`json\n${JSON.stringify(EXAMPLES_SRR_BLANK_RULE, null, 2)}\n\`\`\``,
            body: {
                ...EXAMPLES_SRR_BLANK_RULE,
            },
        },
        {
            label: 'Examples: Block Legacy Clients',
            markdownDescription: `Block requests from legacy clients\n\`\`\`json\n${JSON.stringify(EXAMPLES_SRR_BLOCK_LEGACY_CLIENTS_RULE, null, 2)}\n\`\`\``,
            body: {
                ...EXAMPLES_SRR_BLOCK_LEGACY_CLIENTS_RULE,
            },
        },
    ],
});
