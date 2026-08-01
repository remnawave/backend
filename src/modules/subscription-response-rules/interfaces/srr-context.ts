import { HwidHeaders } from '@common/utils/extract-hwid-headers';
import { TResponseRulesResponseType } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities';

import { TResponseRuleEncryption } from '../types/response-rules.types';

export interface ISRRContext {
    userAgent: string;
    hwidHeaders: HwidHeaders | null;
    isExtendedClient: boolean;
    matchedResponseType: TResponseRulesResponseType;
    matchedRuleName?: string;
    ip: string;
    subscriptionSettings: SubscriptionSettingsEntity;
    overrideTemplateName?: string;
    ignoreHostXrayJsonTemplate?: boolean;
    headersToApply?: Record<string, string>;
    ignoreServeJsonAtBaseSubscription?: boolean;
    disableHwidCheck?: boolean;
    encryption?: TResponseRuleEncryption;
    excludeHostsByTags?: Set<string>;
}
