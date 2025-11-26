import { SubscriptionSettings } from '@prisma/client';

import { TCustomRemarks, THwidSettings } from '@libs/contracts/models';

import { TResponseRulesConfig } from '@modules/subscription-response-rules/types/response-rules.types';

export class SubscriptionSettingsEntity implements SubscriptionSettings {
    uuid: string;
    profileTitle: string;
    supportLink: string;
    profileUpdateInterval: number;
    isProfileWebpageUrlEnabled: boolean;
    serveJsonAtBaseSubscription: boolean;

    happAnnounce: string | null;
    happRouting: string | null;

    isShowCustomRemarks: boolean;
    customRemarks: TCustomRemarks;

    customResponseHeaders: Record<string, string> | null;

    randomizeHosts: boolean;

    responseRules: TResponseRulesConfig | null;
    hwidSettings: THwidSettings;

    createdAt: Date;
    updatedAt: Date;
    constructor(config: Partial<SubscriptionSettings>) {
        Object.assign(this, config);
        return this;
    }
}
