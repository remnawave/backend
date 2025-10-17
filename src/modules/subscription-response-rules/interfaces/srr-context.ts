import { HwidHeaders } from '@common/utils/extract-hwid-headers';
import { TResponseRulesResponseType } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities';

export interface ISRRContext {
    userAgent: string;
    hwidHeaders: HwidHeaders | null;
    isXrayExtSupported: boolean;
    isMihomoExtSupported: boolean;
    matchedResponseType: TResponseRulesResponseType;
    ip: string;
    subscriptionSettings: SubscriptionSettingsEntity;
}
