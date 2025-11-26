import { TCustomRemarks, THwidSettings } from '@libs/contracts/models';

import { TResponseRulesConfig } from '@modules/subscription-response-rules/types/response-rules.types';

import { SubscriptionSettingsEntity } from '../entities';

export class SubscriptionSettingsResponseModel {
    public uuid: string;
    public profileTitle: string;
    public supportLink: string;
    public profileUpdateInterval: number;
    public serveJsonAtBaseSubscription: boolean;
    public isProfileWebpageUrlEnabled: boolean;
    public isShowCustomRemarks: boolean;
    public customRemarks: TCustomRemarks;

    public happAnnounce: string | null;
    public happRouting: string | null;

    public customResponseHeaders: Record<string, string> | null;

    public randomizeHosts: boolean;

    public responseRules: TResponseRulesConfig | null;
    public hwidSettings: THwidSettings | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(entity: SubscriptionSettingsEntity) {
        this.uuid = entity.uuid;
        this.profileTitle = entity.profileTitle;
        this.supportLink = entity.supportLink;
        this.profileUpdateInterval = entity.profileUpdateInterval;
        this.isProfileWebpageUrlEnabled = entity.isProfileWebpageUrlEnabled;
        this.serveJsonAtBaseSubscription = entity.serveJsonAtBaseSubscription;
        this.isShowCustomRemarks = entity.isShowCustomRemarks;
        this.happAnnounce = entity.happAnnounce;
        this.happRouting = entity.happRouting;
        this.customRemarks = entity.customRemarks;
        this.customResponseHeaders = entity.customResponseHeaders;
        this.randomizeHosts = entity.randomizeHosts;
        this.responseRules = entity.responseRules;
        this.hwidSettings = entity.hwidSettings;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}
