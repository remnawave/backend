import z from 'zod';

import { TSubscriptionTemplateType } from '@libs/contracts/constants';
import {
    ExternalSquadHostOverridesSchema,
    ExternalSquadResponseHeadersAddSchema,
    ExternalSquadSubscriptionSettingsSchema,
    TCustomRemarks,
    THwidSettings,
} from '@libs/contracts/models';

import { ExternalSquadWithInfoEntity } from '../entities/external-squad-with-info.entity';

export class GetExternalSquadByUuidResponseModel {
    public readonly uuid: string;
    public readonly viewPosition: number;
    public readonly name: string;
    public readonly tags: string[];
    public readonly info: {
        membersCount: number;
    };

    public readonly templates: {
        templateUuid: string;
        templateType: TSubscriptionTemplateType;
    }[];

    public readonly subscriptionSettings: z.infer<
        typeof ExternalSquadSubscriptionSettingsSchema
    > | null;

    public readonly hostOverrides: z.infer<typeof ExternalSquadHostOverridesSchema> | null;

    public readonly responseHeadersAdd: z.infer<typeof ExternalSquadResponseHeadersAddSchema>;
    public readonly responseHeadersRemove: string[];

    public readonly hwidSettings: THwidSettings | null;
    public readonly customRemarks: TCustomRemarks | null;
    public readonly subpageConfigUuid: string | null;

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(entity: ExternalSquadWithInfoEntity) {
        this.uuid = entity.uuid;
        this.viewPosition = entity.viewPosition;
        this.name = entity.name;
        this.tags = entity.tags;
        this.info = {
            membersCount: Number(entity.membersCount),
        };

        this.templates = entity.templates.map((template) => ({
            templateUuid: template.templateUuid,
            templateType: template.templateType,
        }));

        this.subscriptionSettings = entity.subscriptionSettings;

        this.hostOverrides = entity.hostOverrides;
        this.responseHeadersAdd = entity.responseHeadersAdd;
        this.responseHeadersRemove = entity.responseHeadersRemove;

        this.hwidSettings = entity.hwidSettings;
        this.customRemarks = entity.customRemarks;
        this.subpageConfigUuid = entity.subpageConfigUuid;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}
