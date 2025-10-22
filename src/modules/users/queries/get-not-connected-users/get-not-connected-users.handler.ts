import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities';

import { GetNotConnectedUsersQuery } from './get-not-connected-users.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetNotConnectedUsersQuery)
export class GetNotConnectedUsersHandler
    implements IQueryHandler<GetNotConnectedUsersQuery, ICommandResponse<UserEntity[]>>
{
    private readonly logger = new Logger(GetNotConnectedUsersHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetNotConnectedUsersQuery): Promise<ICommandResponse<UserEntity[]>> {
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
