import {
    REQUEST_TEMPLATE_TYPE,
    RESPONSE_RULES_RESPONSE_TYPES,
    SUBSCRIPTION_TEMPLATE_TYPE,
} from '@libs/contracts/constants';
import { GetSubscriptionByShortUuidByClientTypeCommand } from '@libs/contracts/commands';
import { SubscriptionPageRawConfigSchema } from '@libs/subscription-page/models';

import { ResponseRulesMatcherService } from '@modules/subscription-response-rules/services/response-rules-matcher.service';
import { DEFAULT_SUBPAGE_CONFIG } from '@modules/subscription-page-configs/constants';

function assertEqual(actual: unknown, expected: unknown): void {
    if (actual !== expected) {
        throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
    }
}

function assertExists<T>(value: T | undefined, message: string): asserts value is T {
    if (value === undefined) {
        throw new Error(message);
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

const parsedDefaultSubpageConfig =
    SubscriptionPageRawConfigSchema.safeParse(DEFAULT_SUBPAGE_CONFIG);
assertEqual(parsedDefaultSubpageConfig.success, true);

if (!parsedDefaultSubpageConfig.success) {
    throw new Error(parsedDefaultSubpageConfig.error.message);
}

const defaultSubpageConfig = parsedDefaultSubpageConfig.data;
assertEqual(typeof defaultSubpageConfig.svgLibrary.Surge, 'string');
assertEqual(defaultSubpageConfig.svgLibrary.Surge.includes('<svg'), true);

for (const platform of ['ios', 'macos'] as const) {
    const platformConfig = defaultSubpageConfig.platforms[platform];
    assertExists(platformConfig, `Expected ${platform} in default subscription page config`);

    const app = platformConfig.apps.find(({ name }) => name === 'Surge');
    assertExists(app, `Expected Surge app in ${platform} default subscription page config`);
    assertEqual(app.svgIconKey, 'Surge');

    const subscriptionButton = app.blocks
        .flatMap(({ buttons }) => buttons)
        .find(({ type }) => type === 'subscriptionLink');
    assertExists(subscriptionButton, `Expected Surge subscription button in ${platform}`);
    assertEqual(subscriptionButton.link, 'surge:///install-config?url={{SUBSCRIPTION_LINK}}');
}
