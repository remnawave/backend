import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { UserEntity } from '@modules/users/entities';

export class GetNotConnectedUsersQuery extends Query<ICommandResponse<UserEntity[]>> {
    constructor(
        public readonly startDate: Date,
        public readonly endDate: Date,
    ) {
        super();
    }
}
