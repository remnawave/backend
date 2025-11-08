import { Injectable, Logger } from '@nestjs/common';

import {
    REQUEST_TEMPLATE_TYPE,
    RESPONSE_RULES_CONDITION_OPERATORS,
    RESPONSE_RULES_OPERATORS,
    SUBSCRIPTION_TEMPLATE_TYPE,
    TRequestTemplateTypeKeys,
    TResponseRulesConditionOperator,
} from '@libs/contracts/constants';

import type {
    TResponseRule,
    TResponseRuleCondition,
    ISrrMatchedResult,
    TResponseRulesConfig,
} from '../types/response-rules.types';

@Injectable()
export class ResponseRulesMatcherService {
    private readonly logger = new Logger(ResponseRulesMatcherService.name);

    public matchRules(
        responseRules: TResponseRulesConfig,
        requestHeaders: Record<string, string | string[] | undefined>,
        overrideClientType: TRequestTemplateTypeKeys | undefined,
    ): ISrrMatchedResult {
        this.logger.debug('Matching rules against context');

        if (overrideClientType) {
            return this.handleOverrideClientType(overrideClientType);
        }

        for (const rule of responseRules.rules) {
            if (!rule.enabled) {
                this.logger.debug(`Rule "${rule.name}" is disabled, skipping...`);
                continue;
            }

            const matched = this.matchRule(rule, requestHeaders);

            if (matched) {
                this.logger.debug(`Rule "${rule.name}" matched...`);
                return {
                    matched: true,
                    matchedRule: rule,
                    responseType: rule.responseType,
                };
            }
        }

        return { matched: false };
    }

    private matchRule(
        rule: TResponseRule,
        requestHeaders: Record<string, string | string[] | undefined>,
    ): boolean {
        if (rule.conditions.length === 0) {
            // Assuming that if there are no conditions, the rule should be matched
            return true;
        }

        const results = rule.conditions.map((condition) =>
            this.matchCondition(condition, requestHeaders),
        );

        if (rule.operator === RESPONSE_RULES_OPERATORS.AND) {
            return results.every((result) => result === true);
        } else if (rule.operator === RESPONSE_RULES_OPERATORS.OR) {
            return results.some((result) => result === true);
        }

        throw new Error(`Unknown operator: ${rule.operator}`);
    }

    private matchCondition(
        condition: TResponseRuleCondition,
        requestHeaders: Record<string, string | string[] | undefined>,
    ): boolean {
        let headerValue = this.getHeaderValue(requestHeaders, condition.headerName);

        if (headerValue === undefined) {
            return false;
        }

        let compareValue = condition.value;

        if (!condition.caseSensitive) {
            compareValue = compareValue.toLowerCase();
            headerValue = headerValue.toLowerCase();
        }

        try {
            return this.applyOperator(
                headerValue,
                condition.operator,
                compareValue,
                condition.caseSensitive,
            );
        } catch (error) {
            this.logger.error(`Error matching condition "${condition.headerName}": ${error}`);
            return false;
        }
    }

    private getHeaderValue(
        headers: Record<string, string | string[] | undefined>,
        headerName: string,
    ): string | undefined {
        const lowerHeaderName = headerName.toLowerCase();
        const headerValue = headers[lowerHeaderName];
        return Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
    }

    private applyOperator(
        headerValue: string,
        operator: TResponseRulesConditionOperator,
        compareValue: string,
        caseSensitive: boolean = true,
    ): boolean {
        switch (operator) {
            case RESPONSE_RULES_CONDITION_OPERATORS.EQUALS:
                return headerValue === compareValue;

            case RESPONSE_RULES_CONDITION_OPERATORS.NOT_EQUALS:
                return headerValue !== compareValue;

            case RESPONSE_RULES_CONDITION_OPERATORS.CONTAINS:
                return headerValue.includes(compareValue);

            case RESPONSE_RULES_CONDITION_OPERATORS.NOT_CONTAINS:
                return !headerValue.includes(compareValue);

            case RESPONSE_RULES_CONDITION_OPERATORS.STARTS_WITH:
                return headerValue.startsWith(compareValue);

            case RESPONSE_RULES_CONDITION_OPERATORS.NOT_STARTS_WITH:
                return !headerValue.startsWith(compareValue);

            case RESPONSE_RULES_CONDITION_OPERATORS.ENDS_WITH:
                return headerValue.endsWith(compareValue);

            case RESPONSE_RULES_CONDITION_OPERATORS.NOT_ENDS_WITH:
                return !headerValue.endsWith(compareValue);

            case RESPONSE_RULES_CONDITION_OPERATORS.REGEX:
                try {
                    const regex = new RegExp(compareValue, caseSensitive ? '' : 'i');
                    return regex.test(headerValue);
                } catch {
                    this.logger.error(`Invalid regex: ${compareValue}`);
                    return false;
                }

            case RESPONSE_RULES_CONDITION_OPERATORS.NOT_REGEX:
                try {
                    const regex = new RegExp(compareValue, caseSensitive ? '' : 'i');
                    return !regex.test(headerValue);
                } catch {
                    this.logger.error(`Invalid regex: ${compareValue}`);
                    return false;
                }

            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    private handleOverrideClientType(clientType: TRequestTemplateTypeKeys): ISrrMatchedResult {
        const matchedResponse: ISrrMatchedResult = {
            matched: true,
            responseType: 'BLOCK',
        };

        switch (clientType) {
            case REQUEST_TEMPLATE_TYPE.STASH:
                matchedResponse.responseType = SUBSCRIPTION_TEMPLATE_TYPE.STASH;
                break;
            case REQUEST_TEMPLATE_TYPE.SINGBOX:
                matchedResponse.responseType = SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX;
                break;
            case REQUEST_TEMPLATE_TYPE.MIHOMO:
                matchedResponse.responseType = SUBSCRIPTION_TEMPLATE_TYPE.MIHOMO;
                break;
            case REQUEST_TEMPLATE_TYPE.XRAY_JSON:
            case REQUEST_TEMPLATE_TYPE.V2RAY_JSON:
                matchedResponse.responseType = SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON;
                break;
            case REQUEST_TEMPLATE_TYPE.CLASH:
                matchedResponse.responseType = SUBSCRIPTION_TEMPLATE_TYPE.CLASH;
                break;
            default:
                matchedResponse.responseType = 'BLOCK';
                break;
        }
        return matchedResponse;
    }
}
