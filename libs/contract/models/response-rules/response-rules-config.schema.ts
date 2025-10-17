import { z } from 'zod';

import {
    RESPONSE_RULES_CONDITION_OPERATORS,
    RESPONSE_RULES_CONFIG_VERSION,
    RESPONSE_RULES_OPERATORS,
    RESPONSE_RULES_RESPONSE_TYPES,
} from '../../constants';
import { ResponseRuleSchema } from './response-rule.schema';

const RuleExampleJson = JSON.stringify(
    {
        name: 'Block Legacy Clients',
        description: 'Block requests from legacy clients',
        operator: RESPONSE_RULES_OPERATORS.OR,
        enabled: true,
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

export const ResponseRulesConfigSchema = z.object({
    version: z.nativeEnum(RESPONSE_RULES_CONFIG_VERSION).describe(
        JSON.stringify({
            title: 'Response Rules Config Version',
            markdownDescription:
                'Version of the **response rules** config. Currently supported version is **1**.',
        }),
    ),
    rules: z.array(ResponseRuleSchema).describe(
        JSON.stringify({
            examples: [
                [
                    {
                        name: 'This is example rule name',
                        description: 'This is example rule description (optional)',
                        operator: RESPONSE_RULES_OPERATORS.AND,
                        enabled: true,
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
                ],
            ],

            markdownDescription: `Array of **response rules**.\n\nRules served from top to bottom – first matched rule is applied. Each rule is an object with the following properties:\n\n- **name**: Name of the response rule.\n- **description**: Description of the response rule.(Optional) \n- **enabled**: Whether the response rule is enabled. If disabled, the rule will not be applied.\n- **operator**: Operator to use for the rule.\n- **conditions**: Array of conditions to use for the rule.\n- **responseType**: Type of the response.\n\nExamples:\n\n1. Block legacy clients:\n\n\`\`\`json\n${RuleExampleJson}\n\`\`\`\n\nThis example shows how to block requests from legacy clients by checking if the User-Agent header contains "Hiddify" or "FoxRay".`,
        }),
    ),
});
