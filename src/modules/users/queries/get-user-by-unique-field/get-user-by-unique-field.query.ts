import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { BaseUserEntity, UserEntity } from '@modules/users/entities';

export class GetUserByUniqueFieldQuery extends Query<TResult<UserEntity>> {
    constructor(
        public readonly field: Partial<
            Pick<BaseUserEntity, 'tId' | 'uuid' | 'shortUuid' | 'username'>
        >,
        public readonly includeOptions: {
            activeInternalSquads: boolean;
        } = {
            activeInternalSquads: true,
        },
    ) {
        super();
    }
}
