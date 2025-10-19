import { z } from 'zod';

import { EXAMPLES_SRR_BLANK_RULE } from './response-rules-examples';
import { RESPONSE_RULES_CONFIG_VERSION } from '../../constants';
import { ResponseRuleSchema } from './response-rule.schema';

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
            title: 'Response Rules',
            markdownDescription: `Array of **response rules**. Rules are evaluated in order and the first rule that matches is applied. If no rule matches, request will be blocked by default.\n\n**Example:**\n\`\`\`json\n${JSON.stringify([EXAMPLES_SRR_BLANK_RULE], null, 2)}\n\`\`\``,
            defaultSnippets: [],
        }),
    ),
});
