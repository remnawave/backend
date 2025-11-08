import { SubscriptionTemplateEntity } from '../entities/subscription-template.entity';
import { BaseTemplateResponseModel } from './base-template.response.model';

export class GetSubscriptionTemplatesResponseModel {
    public readonly total: number;
    public readonly templates: BaseTemplateResponseModel[];

    constructor(entities: SubscriptionTemplateEntity[], total: number) {
        this.total = total;
        this.templates = entities.map((template) => new BaseTemplateResponseModel(template));
    }
}
