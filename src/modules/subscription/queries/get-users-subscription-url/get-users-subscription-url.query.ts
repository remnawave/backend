import { UserEntity } from '@modules/users/entities';

export class GetUsersSubscriptionUrlQuery {
    constructor(public readonly users: Pick<UserEntity, 'shortUuid' | 'username'>[]) {}
}
