import { GetSubscriptionByShortUuidByClientTypeCommand } from '@libs/contracts/commands';
import {
    REQUEST_TEMPLATE_TYPE,
    RESPONSE_RULES_RESPONSE_TYPES,
    SUBSCRIPTION_TEMPLATE_TYPE,
} from '@libs/contracts/constants';

import { ResponseRulesMatcherService } from '@modules/subscription-response-rules/services/response-rules-matcher.service';

function assertEqual(actual: unknown, expected: unknown): void {
    if (actual !== expected) {
        throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
    }
}

const requestTemplateType = REQUEST_TEMPLATE_TYPE as Record<string, string>;
const subscriptionTemplateType = SUBSCRIPTION_TEMPLATE_TYPE as Record<string, string>;
const responseRulesResponseTypes = RESPONSE_RULES_RESPONSE_TYPES as Record<string, string>;

assertEqual(requestTemplateType.SURGE, 'surge');
assertEqual(subscriptionTemplateType.SURGE, 'SURGE');
assertEqual(responseRulesResponseTypes.SURGE, 'SURGE');

const parsedRequest = GetSubscriptionByShortUuidByClientTypeCommand.RequestSchema.safeParse({
    shortUuid: 'surge-preview',
    clientType: 'surge',
});

assertEqual(parsedRequest.success, true);

const matcher = new ResponseRulesMatcherService();
const match = matcher.matchRules(
    {
        version: '1',
        rules: [],
        settings: {
            disableSubscriptionAccessByPath: false,
        },
    },
    {},
    'surge' as never,
);

assertEqual(match.matched, true);
assertEqual(match.responseType, 'SURGE');
