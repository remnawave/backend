import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { BaseUserEntity, UserEntity } from '@modules/users/entities';

export class GetUserByUniqueFieldQuery extends Query<ICommandResponse<UserEntity>> {
    constructor(
        public readonly field: Partial<
            Pick<BaseUserEntity, 'tId' | 'uuid' | 'shortUuid' | 'username'>
        >,
        public readonly includeOptions: {
            activeInternalSquads: boolean;
            lastConnectedNode: boolean;
        } = {
            activeInternalSquads: true,
            lastConnectedNode: true,
        },
    ) {
        super();
    }
}
