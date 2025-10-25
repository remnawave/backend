import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';

export class GetTemplateNameQuery extends Query<ICommandResponse<string | null>> {
    constructor(
        public readonly externalSquadUuid: string,
        public readonly templateType: TSubscriptionTemplateType,
    ) {
        super();
    }
}
