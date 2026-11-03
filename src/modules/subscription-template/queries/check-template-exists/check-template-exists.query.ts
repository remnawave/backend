import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';

export class CheckTemplateExistsQuery extends Query<TResult<boolean>> {
    constructor(
        public readonly name: string,
        public readonly templateType: TSubscriptionTemplateType,
    ) {
        super();
    }
}
