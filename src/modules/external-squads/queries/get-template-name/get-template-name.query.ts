import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';

export class GetTemplateNameQuery extends Query<TResult<string>> {
    constructor(
        public readonly externalSquadUuid: string,
        public readonly templateType: TSubscriptionTemplateType,
    ) {
        super();
    }
}
