import { SubscriptionTemplate } from '@prisma/client';

import { TSubscriptionTemplateType } from '@libs/contracts/constants';

export class SubscriptionTemplateEntity implements SubscriptionTemplate {
    uuid: string;
    name: string;
    templateType: TSubscriptionTemplateType;
    templateYaml: string | null;
    templateJson: object | null;

    createdAt: Date;
    updatedAt: Date;
    constructor(config: Partial<SubscriptionTemplate>) {
        Object.assign(this, config);
        return this;
    }
}
