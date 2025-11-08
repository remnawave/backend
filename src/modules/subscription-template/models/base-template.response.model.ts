import { TSubscriptionTemplateType } from '@libs/contracts/constants';

import { SubscriptionTemplateEntity } from '../entities/subscription-template.entity';

export class BaseTemplateResponseModel {
    public uuid: string;
    public name: string;
    public templateType: TSubscriptionTemplateType;
    public templateJson: object | null;
    public encodedTemplateYaml: string | null;

    constructor(entity: SubscriptionTemplateEntity) {
        this.uuid = entity.uuid;
        this.name = entity.name;
        this.templateType = entity.templateType;
        this.templateJson = entity.templateJson;
        this.encodedTemplateYaml = entity.templateYaml
            ? Buffer.from(entity.templateYaml, 'utf8').toString('base64')
            : null;
    }
}
