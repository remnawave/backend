import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { PasskeyEntity } from '@modules/admin/entities/passkey.entity';

export class FindPasskeyByIdAndAdminUuidQuery extends Query<TResult<PasskeyEntity>> {
    constructor(
        public readonly id: string,
        public readonly adminUuid: string,
    ) {
        super();
    }
}
