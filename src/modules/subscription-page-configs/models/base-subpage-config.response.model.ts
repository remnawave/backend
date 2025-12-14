import { TSubscriptionPageRawConfig } from '@libs/subscription-page/models';

import { SubscriptionPageConfigEntity } from '../entities/sub-page-config.entity';

export class BaseSubscriptionPageConfigResponseModel {
    public uuid: string;
    public viewPosition: number;
    public name: string;
    public config: TSubscriptionPageRawConfig | null;

    constructor(entity: SubscriptionPageConfigEntity) {
        this.uuid = entity.uuid;
        this.viewPosition = entity.viewPosition;
        this.name = entity.name;
        if (entity.config) {
            this.config = entity.config as unknown as TSubscriptionPageRawConfig;
        } else {
            this.config = null;
        }
    }
}
