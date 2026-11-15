import type {
    TResponseRule,
    TResponseRuleCondition,
    TResponseRuleConditionNode,
    TResponseRulePresenceCondition,
    TResponseRuleStringCondition,
    TResponseRuleVersionCondition,
    ISrrMatchedResult,
    TResponseRulesConfig,
} from '../types/response-rules.types';

import { Injectable, Logger } from '@nestjs/common';

import {
    REQUEST_TEMPLATE_TYPE,
    RESPONSE_RULES_CONDITION_OPERATORS,
    RESPONSE_RULES_OPERATORS,
    RESPONSE_RULES_PRESENCE_CONDITION_OPERATORS,
    RESPONSE_RULES_VERSION_CONDITION_OPERATORS,
    SUBSCRIPTION_TEMPLATE_TYPE,
    TRequestTemplateTypeKeys,
    TResponseRulesConditionOperator,
} from '@libs/contracts/constants';

const VERSION_OPERATORS: ReadonlySet<string> = new Set(
    Object.values(RESPONSE_RULES_VERSION_CONDITION_OPERATORS),
);
const PRESENCE_OPERATORS: ReadonlySet<string> = new Set(
    Object.values(RESPONSE_RULES_PRESENCE_CONDITION_OPERATORS),
);
const NEGATED_OPERATORS: ReadonlySet<string> = new Set([
    RESPONSE_RULES_CONDITION_OPERATORS.NOT_EQUALS,
    RESPONSE_RULES_CONDITION_OPERATORS.NOT_CONTAINS,
    RESPONSE_RULES_CONDITION_OPERATORS.NOT_STARTS_WITH,
    RESPONSE_RULES_CONDITION_OPERATORS.NOT_ENDS_WITH,
    RESPONSE_RULES_CONDITION_OPERATORS.NOT_REGEX,
]);
const REGEX_OPERATORS: ReadonlySet<string> = new Set([
    RESPONSE_RULES_CONDITION_OPERATORS.REGEX,
    RESPONSE_RULES_CONDITION_OPERATORS.NOT_REGEX,
]);
const VERSION_REGEX = /^v?(\d+(?:\.\d+)*)/i;

@Injectable()
export class ResponseRulesMatcherService {
    private readonly logger = new Logger(ResponseRulesMatcherService.name);

    public matchRules(
        responseRules: TResponseRulesConfig,
        requestHeaders: Record<string, string | string[] | undefined>,
        overrideClientType: TRequestTemplateTypeKeys | undefined,
    ): ISrrMatchedResult {
        if (overrideClientType) {
            if (responseRules.settings && responseRules.settings.disableSubscriptionAccessByPath) {
                return {
                    matched: true,
                    responseType: 'BLOCK',
                };
            }

            return this.handleOverrideClientType(overrideClientType);
        }

        for (const rule of responseRules.rules) {
            if (!rule.enabled) {
                continue;
            }

            const matched = this.matchRule(rule, requestHeaders);

            if (matched) {
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

        return this.matchGroup(rule.operator, rule.conditions, requestHeaders);
    }

    private matchGroup(
        operator: TResponseRule['operator'],
        nodes: TResponseRuleConditionNode[],
        requestHeaders: Record<string, string | string[] | undefined>,
    ): boolean {
        if (operator === RESPONSE_RULES_OPERATORS.AND) {
            return nodes.every((node) => this.matchNode(node, requestHeaders));
        } else if (operator === RESPONSE_RULES_OPERATORS.OR) {
            return nodes.some((node) => this.matchNode(node, requestHeaders));
        }

        throw new Error(`Unknown operator: ${operator}`);
    }

    private matchNode(
        node: TResponseRuleConditionNode,
        requestHeaders: Record<string, string | string[] | undefined>,
    ): boolean {
        if ('conditions' in node) {
            return this.matchGroup(node.operator, node.conditions, requestHeaders);
        }

        return this.matchCondition(node, requestHeaders);
    }

    private matchCondition(
        condition: TResponseRuleCondition,
        requestHeaders: Record<string, string | string[] | undefined>,
    ): boolean {
        const headerValue = this.getHeaderValue(requestHeaders, condition.headerName);

        if (this.isPresenceCondition(condition)) {
            const exists = headerValue !== undefined;

            return condition.operator === RESPONSE_RULES_CONDITION_OPERATORS.EXISTS
                ? exists
                : !exists;
        }

        if (headerValue === undefined) {
            return false;
        }

        try {
            if (this.isVersionCondition(condition)) {
                return this.matchVersionCondition(condition, headerValue);
            }

            return this.matchStringCondition(condition, headerValue);
        } catch (error) {
            this.logger.error(`Error matching condition "${condition.headerName}": ${error}`);
            return false;
        }
    }

    private isPresenceCondition(
        condition: TResponseRuleCondition,
    ): condition is TResponseRulePresenceCondition {
        return PRESENCE_OPERATORS.has(condition.operator);
    }

    private isVersionCondition(
        condition: TResponseRuleCondition,
    ): condition is TResponseRuleVersionCondition {
        return VERSION_OPERATORS.has(condition.operator);
    }

    private matchVersionCondition(
        condition: TResponseRuleVersionCondition,
        headerValue: string,
    ): boolean {
        const source = this.extractVersionSource(headerValue, condition.versionPattern);

        if (source === null) {
            return false;
        }

        const actual = this.parseVersion(source);
        const expected = this.parseVersion(condition.value);

        if (!actual || !expected) {
            return false;
        }

        const result = this.compareVersions(actual, expected);

        switch (condition.operator) {
            case RESPONSE_RULES_CONDITION_OPERATORS.VERSION_EQ:
                return result === 0;
            case RESPONSE_RULES_CONDITION_OPERATORS.VERSION_GT:
                return result > 0;
            case RESPONSE_RULES_CONDITION_OPERATORS.VERSION_GTE:
                return result >= 0;
            case RESPONSE_RULES_CONDITION_OPERATORS.VERSION_LT:
                return result < 0;
            case RESPONSE_RULES_CONDITION_OPERATORS.VERSION_LTE:
                return result <= 0;
            default:
                throw new Error(`Unknown operator: ${condition.operator}`);
        }
    }

    private extractVersionSource(headerValue: string, versionPattern?: string): string | null {
        if (!versionPattern) {
            return headerValue;
        }

        const match = new RegExp(versionPattern, 'i').exec(headerValue);

        return match?.[1] ?? null;
    }

    private parseVersion(value: string): number[] | null {
        const match = VERSION_REGEX.exec(value.trim());

        if (!match) {
            return null;
        }

        return match[1].split('.').map(Number);
    }

    private compareVersions(left: number[], right: number[]): number {
        const length = Math.max(left.length, right.length);

        for (let index = 0; index < length; index++) {
            const diff = (left[index] ?? 0) - (right[index] ?? 0);

            if (diff !== 0) {
                return Math.sign(diff);
            }
        }

        return 0;
    }

    private matchStringCondition(
        condition: TResponseRuleStringCondition,
        rawHeaderValue: string,
    ): boolean {
        const caseSensitive = condition.caseSensitive ?? false;
        const isRegex = REGEX_OPERATORS.has(condition.operator);
        const headerValue = caseSensitive ? rawHeaderValue : rawHeaderValue.toLowerCase();
        const compareValues = Array.isArray(condition.value) ? condition.value : [condition.value];

        const matches = (compareValue: string) =>
            this.applyOperator(
                headerValue,
                condition.operator,
                caseSensitive || isRegex ? compareValue : compareValue.toLowerCase(),
                caseSensitive,
            );

        return NEGATED_OPERATORS.has(condition.operator)
            ? compareValues.every(matches)
            : compareValues.some(matches);
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
