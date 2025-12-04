import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities';

import { GetNotConnectedUsersQuery } from './get-not-connected-users.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetNotConnectedUsersQuery)
export class GetNotConnectedUsersHandler implements IQueryHandler<
    GetNotConnectedUsersQuery,
    TResult<UserEntity[]>
> {
    private readonly logger = new Logger(GetNotConnectedUsersHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetNotConnectedUsersQuery): Promise<TResult<UserEntity[]>> {
        try {
            const users = await this.usersRepository.findNotConnectedUsers(
                query.startDate,
                query.endDate,
            );

            return {
                isOk: true,
                response: users,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
