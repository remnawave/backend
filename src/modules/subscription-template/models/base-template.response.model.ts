import { TSubscriptionTemplateType } from '@libs/contracts/constants';

import { SubscriptionTemplateEntity } from '../entities/subscription-template.entity';

export class BaseTemplateResponseModel {
    public uuid: string;
    public viewPosition: number;
    public name: string;
    public tags: string[];
    public templateType: TSubscriptionTemplateType;
    public templateJson: object | null;
    public encodedTemplateYaml: string | null;

    constructor(entity: SubscriptionTemplateEntity) {
        this.uuid = entity.uuid;
        this.viewPosition = entity.viewPosition;
        this.name = entity.name;
        this.tags = entity.tags;
        this.templateType = entity.templateType;
        this.templateJson = entity.templateJson ?? null;
        this.encodedTemplateYaml = entity.templateYaml
            ? Buffer.from(entity.templateYaml, 'utf8').toString('base64')
            : null;
    }
}
