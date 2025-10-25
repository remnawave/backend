import z from 'zod';

import {
    RESPONSE_RULES_CONDITION_OPERATORS,
    RESPONSE_RULES_OPERATORS,
    RESPONSE_RULES_RESPONSE_TYPES,
} from '../../constants';
import { ResponseRuleSchema, ResponseRuleSchemaBase } from './response-rule.schema';

export const EXAMPLES_SRR_BLANK_RULE: z.infer<typeof ResponseRuleSchema> = {
    name: 'Blank rule',
    description: 'Blank rule',
    operator: 'AND',
    enabled: true,
    conditions: [],
    responseType: 'BLOCK',
    responseModifications: {
        headers: [],
    },
};

export const EXAMPLES_SRR_BLOCK_LEGACY_CLIENTS_RULE: z.infer<typeof ResponseRuleSchema> = {
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
};

export function generateResponseRuleDescription(schema: typeof ResponseRuleSchemaBase) {
    const fields = Object.entries(schema.shape).map(([key, value]) => {
        const desc = value.description ? JSON.parse(value.description) : {};
        return {
            name: key,
            description: desc.markdownDescription || desc.title || 'No description',
        };
    });

    const fieldsText = fields
        .map((field) => `- **${field.name}**: ${field.description}`)
        .join('\n');

    return `Response rule configuration.\n\n**Fields:**\n${fieldsText}\n\n**Example:**\n\`\`\`json\n${JSON.stringify(EXAMPLES_SRR_BLOCK_LEGACY_CLIENTS_RULE, null, 2)}\n\`\`\``;
}
