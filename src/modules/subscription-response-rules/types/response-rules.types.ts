import { z } from 'zod';

import {
    ResponseRuleConditionSchema,
    ResponseRuleSchema,
    ResponseRulesConfigSchema,
} from '@libs/contracts/models';
import { TResponseRulesResponseType } from '@libs/contracts/constants';

export type TResponseRulesConfig = z.infer<typeof ResponseRulesConfigSchema>;
export type TResponseRule = z.infer<typeof ResponseRuleSchema>;
export type TResponseRuleCondition = z.infer<typeof ResponseRuleConditionSchema>;

export interface ISrrMatchedResult {
    matched: boolean;
    matchedRule?: TResponseRule;
    responseType?: TResponseRulesResponseType;
}
