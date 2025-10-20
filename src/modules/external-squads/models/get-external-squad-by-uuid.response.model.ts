import { TSubscriptionTemplateType } from '@libs/contracts/constants';

import { ExternalSquadWithInfoEntity } from '../entities/internal-squad-with-info.entity';

export class GetExternalSquadByUuidResponseModel {
    public readonly uuid: string;
    public readonly name: string;
    public readonly info: {
        membersCount: number;
    };

    public readonly templates: {
        templateUuid: string;
        templateType: TSubscriptionTemplateType;
    }[];

    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(entity: ExternalSquadWithInfoEntity) {
        this.uuid = entity.uuid;
        this.name = entity.name;
        this.info = {
            membersCount: Number(entity.membersCount),
        };

        this.templates = entity.templates.map((template) => ({
            templateUuid: template.templateUuid,
            templateType: template.templateType,
        }));

        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}
