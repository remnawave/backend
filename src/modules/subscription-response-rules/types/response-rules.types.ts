import { z } from 'zod';

import { TResponseRulesResponseType } from '@libs/contracts/constants';
import {
    ResponseRuleConditionGroupSchema,
    ResponseRuleConditionNodeSchema,
    ResponseRuleConditionSchema,
    ResponseRulePresenceConditionSchema,
    ResponseRuleSchema,
    ResponseRuleStringConditionSchema,
    ResponseRuleVersionConditionSchema,
    ResponseRulesConfigSchema,
    ResponseRuleEncryptionSchema,
    ResponseRuleModificationsSchema,
} from '@libs/contracts/models';

export type TResponseRulesConfig = z.infer<typeof ResponseRulesConfigSchema>;
export type TResponseRule = z.infer<typeof ResponseRuleSchema>;
export type TResponseRuleCondition = z.infer<typeof ResponseRuleConditionSchema>;
export type TResponseRuleStringCondition = z.infer<typeof ResponseRuleStringConditionSchema>;
export type TResponseRuleVersionCondition = z.infer<typeof ResponseRuleVersionConditionSchema>;
export type TResponseRulePresenceCondition = z.infer<typeof ResponseRulePresenceConditionSchema>;
export type TResponseRuleConditionGroup = z.infer<typeof ResponseRuleConditionGroupSchema>;
export type TResponseRuleConditionNode = z.infer<typeof ResponseRuleConditionNodeSchema>;
export type TResponseRuleModifications = z.infer<typeof ResponseRuleModificationsSchema>;
export type TResponseRuleEncryption = z.infer<typeof ResponseRuleEncryptionSchema>;

export interface ISrrMatchedResult {
    matched: boolean;
    matchedRule?: TResponseRule;
    responseType?: TResponseRulesResponseType;
}
